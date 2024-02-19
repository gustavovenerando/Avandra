import { ExtractionInfoI } from "./interface";
import { injectable } from "inversify";

@injectable()
class TaskExecution {

    async executeExtraction(extractionInfo: ExtractionInfoI) {
        const { puppeteerClass, extractionData, chunkSize, extractFunction } = extractionInfo;

        const chunks = this.sliceArrayIntoChunks(extractionData, chunkSize);

        const result = [];
        const rejResults = [];
        for (let chunk of chunks) {
            const chunkResult = await Promise.allSettled(chunk.map(pageInfo => extractFunction(puppeteerClass, pageInfo)))

            //@ts-ignore
            const fulfilledResults = chunkResult.filter(res => res.status === "fulfilled").map(res => res.value);
            result.push(...fulfilledResults);

            //@ts-ignore
            const rejectedResults = chunkResult.filter(res => res.status === "rejected").map(res => res.reason);
            rejResults.push(...rejectedResults);
        }

        if (rejResults.length) {
            const flatRejRes = rejResults.flat(Infinity);
            for (const rej of flatRejRes) {
                console.log(
                    "Rejected result - Parameters: ", rej.url || rej.productSelectors,
                    " - Message: ", rej.message,
                    " - Stack: ", rej.stack
                );
            }
        }

        return result;
    }


    sliceArrayIntoChunks(arr:any[], chunkSize:number){
        const chunks = []
        let i = 0
        const n = arr.length;

        while (i < n) {
            chunks.push(arr.slice(i, i += chunkSize))
        }

        return chunks;
    }
}

export default TaskExecution;
