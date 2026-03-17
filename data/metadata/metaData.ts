import { MetadataConfig } from "../../types/metadata.types";

export const metadata: Record<string, MetadataConfig> = {

    chemistryUndergrad: {
        questionType: "essay",
        finalAnswer: "The answer is provided",
        solutionProcess: "Step by step process",
        thinkingProcess: "Logical reasoning applied",
        answerUnit: "N/A",
        noUnitRequired: false,
        knowledgePoints: ["Physics"],   // ✅ changed
        level: "Undergraduate",
        discipline: "Organic Chemistry"
    }

}