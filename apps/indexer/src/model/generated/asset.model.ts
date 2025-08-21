import {BigDecimal} from "@subsquid/big-decimal"
import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, IntColumn as IntColumn_, BooleanColumn as BooleanColumn_, BigDecimalColumn as BigDecimalColumn_} from "@subsquid/typeorm-store"

@Entity_()
export class Asset {
    constructor(props?: Partial<Asset>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: false})
    name!: string

    @StringColumn_({nullable: false})
    symbol!: string

    @IntColumn_({nullable: true})
    decimals!: number | undefined | null

    @BooleanColumn_({nullable: true})
    whitelisted!: boolean | undefined | null

    @BooleanColumn_({nullable: true})
    stable!: boolean | undefined | null

    @BooleanColumn_({nullable: true})
    shortable!: boolean | undefined | null

    @IntColumn_({nullable: true})
    minProfitBasisPoints!: number | undefined | null

    @BigDecimalColumn_({nullable: true})
    weight!: BigDecimal | undefined | null

    @StringColumn_({nullable: true})
    feedId!: string | undefined | null

    @BigDecimalColumn_({nullable: true})
    price!: BigDecimal | undefined | null
}
