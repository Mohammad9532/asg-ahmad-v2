/**
 * Creates the aggregation pipeline for filtering by date and calculating a total.
 */
function createAggregationPipeline(startDate, endDate, isMonthly) {
    const pipeline = [
        {
            "$match": {
                "date": {
                    "$gte": startDate,
                    "$lte": endDate
                }
            }
        }
    ];

    if (isMonthly) {
        pipeline.push({
            "$group": {
                "_id": {
                    "year": { "$year": "$date" },
                    "month": { "$month": "$date" }
                },
                "totalAmount": { "$sum": "$amount" },
                "canceledAmount": {
                    "$sum": {
                        "$cond": {
                            if: { "$in": [{ "$toLower": "$status" }, ["cancel", "canceled", "cancelled", "deducted"]] },
                            then: "$amount",
                            else: 0
                        }
                    }
                },
                "count": { "$sum": 1 }
            }
        });

        pipeline.push({
            "$project": {
                "_id": {
                    "year": "$_id.year",
                    "month": "$_id.month"
                },
                "monthYear": {
                    "$concat": [
                        { "$toString": "$_id.year" },
                        "-",
                        { "$cond": { if: { "$lt": ["$_id.month", 10] }, then: { "$concat": ["0", { "$toString": "$_id.month" }] }, else: { "$toString": "$_id.month" } } }
                    ]
                },
                "totalAmount": 1,
                "canceledAmount": 1,
                "netTotalAmount": { "$subtract": ["$totalAmount", "$canceledAmount"] },
                "count": 1
            }
        });

        pipeline.push({
            "$sort": { "monthYear": 1 }
        });

    } else {
        pipeline.push({
            "$group": {
                "_id": null,
                "totalAmount": { "$sum": "$amount" },
                "filteredData": { "$push": "$$ROOT" },
                "cancelAmount": {
                    "$sum": {
                        "$cond": {
                            if: { "$in": [{ "$toLower": "$status" }, ["cancel", "canceled", "cancelled", "deducted"]] },
                            then: "$amount",
                            else: 0
                        }
                    }
                }
            }
        });

        pipeline.push({
            "$project": {
                "_id": 0,
                "totalAmount": 1,
                "filteredData": 1,
                "cancelAmount": 1,
                "netAmount": { "$subtract": ["$totalAmount", "$cancelAmount"] }
            }
        });
    }

    return pipeline;
}

module.exports = { createAggregationPipeline };
