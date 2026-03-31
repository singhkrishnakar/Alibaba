import { ExpectedPromptResponse } from "../../types/expectedPromptResponse.type";

export const expectedResponse: Record<string, ExpectedPromptResponse> = {

    simpleGreeting: {
        expectedResponseText: "hi"
    },

    helloPrompt: {
        expectedResponseText: "Hello"
    },

    modelFailingPrompt: {
        expectedResponseText: "Model Error"
    },

    computeValueOfi: {
        expectedResponseText: "$\\frac{\\pi^2\\log(2)-7\\zeta(3)-8\\pi G}{64}$"
    }

};