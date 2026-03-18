import { ExpectedPromptResponse } from "../../types/expectedPromptResponse.type";

export const expectedResponse: Record<string, ExpectedPromptResponse> = {

    simpleGreeting: {
        expectedResponseText: "hi"
    },

    helloPrompt: {
        expectedResponseText: "Hello"
    }

};