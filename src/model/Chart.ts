import * as _ from 'lodash'
import {Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, JoinColumn} from "typeorm"

import * as db from '../db'
import ChartConfig, { ChartConfigProps } from '../../js/charts/ChartConfig'
import {getVariableData} from './Variable'
import User from './User'

@Entity("charts")
export class Chart extends BaseEntity {
    @PrimaryGeneratedColumn() id!: number
    @Column({ type: 'json' }) config: any
    @Column() lastEditedAt!: Date
    @Column({ nullable: true }) lastEditedByUserId!: string
    @Column({ nullable: true }) publishedAt!: Date
    @Column({ nullable: true }) publishedByUserId!: string
    @Column() createdAt!: Date
    @Column() updatedAt!: Date
    @Column() starred!: boolean

    @ManyToOne(type => User, user => user.lastEditedCharts) @JoinColumn({ name: 'last_edited_by', referencedColumnName: 'name' })
    lastEditedByUser!: User
    @ManyToOne(type => User, user => user.publishedCharts) @JoinColumn({ name: 'published_by', referencedColumnName: 'name' })
    publishedByUser!: User
}

// TODO integrate this old logic with typeorm
export default class OldChart {
    static listFields = `
        charts.id,
        JSON_UNQUOTE(JSON_EXTRACT(charts.config, "$.title")) AS title,
        JSON_UNQUOTE(JSON_EXTRACT(charts.config, "$.slug")) AS slug,
        JSON_UNQUOTE(JSON_EXTRACT(charts.config, "$.type")) AS type,
        JSON_UNQUOTE(JSON_EXTRACT(charts.config, "$.internalNotes")) AS internalNotes,
        JSON_UNQUOTE(JSON_EXTRACT(charts.config, "$.isPublished")) AS isPublished,
        JSON_UNQUOTE(JSON_EXTRACT(charts.config, "$.tab")) AS tab,
        JSON_EXTRACT(charts.config, "$.hasChartTab") = true AS hasChartTab,
        JSON_EXTRACT(charts.config, "$.hasMapTab") = true AS hasMapTab,
        charts.starred AS isStarred,
        charts.lastEditedAt,
        charts.lastEditedBy,
        charts.publishedAt,
        charts.publishedBy
    `

    static async getBySlug(slug: string): Promise<OldChart> {
        const row = await db.get(`SELECT id, config FROM charts WHERE JSON_EXTRACT(config, "$.slug") = ?`, [slug])
        return new OldChart(row.id, JSON.parse(row.config))
    }

    id: number
    config: ChartConfigProps
    constructor(id: number, config: ChartConfigProps) {
        this.id = id
        this.config = config

        // XXX todo make the relationship between chart models and chart configuration more defined
        this.config.id = id
    }

    async getVariableData(): Promise<any> {
        const variableIds = _.uniq(this.config.dimensions.map(d => d.variableId))
        return getVariableData(variableIds)
    }
}