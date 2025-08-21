import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, DateTimeColumn as DateTimeColumn_, BigDecimalColumn as BigDecimalColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class PriceTick {
    constructor(props?: Partial<PriceTick>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: true})
    ticker!: string | undefined | null

    @DateTimeColumn_({nullable: true})
    timestamp!: Date | undefined | null

    @BigDecimalColumn_({nullable: true})
    price!: BigDecimal | undefined | null
}
