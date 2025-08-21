import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, DateTimeColumn as DateTimeColumn_, BigDecimalColumn as BigDecimalColumn_, ManyToOne as ManyToOne_, Index as Index_} from "@subsquid/typeorm-store"
import {CandleResolution} from "./_candleResolution"
import {Market} from "./market.model"

@Entity_()
export class Candle {
    constructor(props?: Partial<Candle>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: true})
    ticker!: string | undefined | null

    @Column_("varchar", {length: 3, nullable: true})
    resolution!: CandleResolution | undefined | null

    @DateTimeColumn_({nullable: true})
    startedAt!: Date | undefined | null

    @BigDecimalColumn_({nullable: true})
    open!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: true})
    close!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: true})
    high!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: true})
    low!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: true})
    baseTokenVolume!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: true})
    usdVolume!: BigDecimal | undefined | null

    @BigDecimalColumn_({nullable: true})
    startingOpenInterest!: BigDecimal | undefined | null

    @Index_()
    @ManyToOne_(() => Market, {nullable: true})
    market!: Market | undefined | null
}
