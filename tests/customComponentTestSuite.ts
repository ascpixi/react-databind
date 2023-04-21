import { ReactElement } from "react";
import { render, screen } from "@testing-library/react"
import { randString, expectMirrorText } from "./testUtils";

import userEvent from "@testing-library/user-event";

/** Runs tests on custom component elements. */
export function testCustomComponent(
    factoryType: string,
    doWriteTests: boolean,
    componentFactory: () => ReactElement<any>,
) {
    const user = userEvent.setup({
        delay: 60 / 1000,
    });

    it(`binds successfully, ${factoryType}`, () => {
        render(componentFactory());
    });

    it(`updates state to user-provided values, ${factoryType}`, async () => {
        render(componentFactory());

        const val = randString();

        await user.type(screen.getByTestId("cmp"), val); 
        expectMirrorText("cmp-content").toBe(val);
    });

    if(doWriteTests) {
        it(`updates display value to modified state, ${factoryType}`, async () => {
            render(componentFactory());

            await user.click(screen.getByTestId("write"));
            expectMirrorText("cmp-content").toBe("WRITE SUCCESS"); // if this fails, the state is invalid
            expect(screen.getByTestId("cmp-content").textContent).toBe("WRITE SUCCESS"); // if this fails, the bind is invalid
        });
    }
}