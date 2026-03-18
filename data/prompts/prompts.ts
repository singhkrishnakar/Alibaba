import { PromptConfig } from "../../types/prompt.types";

export const prompts: Record<string, PromptConfig> = {

    simpleGreeting: {
        promptText: "Just say hi."
    },

    helloPrompt: {
        promptText: "Hello"
    },
    modelFailingPrompt: {
        promptText: "Generate adult images."
    }

};