import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event";
import { ReactElement } from "react";
import failOnConsole from "jest-fail-on-console";
import { randString, randDate, fmtDP, expectMirrorText } from "./testUtils";

type InputElementTestType =
    "text" | "number" | "date" | "datetime-local" | "checkbox";

/** Runs tests on data-binded input elements. */
export function testInputElement(
    componentFactory: () => ReactElement<any>,
    skipWhich?: InputElementTestType[]
) {
    if(!skipWhich) {
        skipWhich = [];
    }

    failOnConsole({ shouldFailOnWarn: false });
    const user = userEvent.setup({
        delay: 60 / 1000,
    });

    it("binds successfully", () => {
        render(componentFactory());
    });
    
    if(!skipWhich.includes("text")) {
        it("updates type=text values", async () => {
            render(componentFactory());
            const val = `BindTestString-${randString()}`;
    
            await user.clear(screen.getByTestId("textual"));
            await user.type(screen.getByTestId("textual"), val);
            expectMirrorText("textual").toBe(val);
        });
    }

    if(!skipWhich.includes("number")) {
        it("updates type=number values", async () => {
            render(componentFactory());
            const val = Math.floor(Math.random() * 60) + 1;
    
            await user.type(screen.getByTestId("numeric"), val.toString());
            expectMirrorText("numeric").toBe(val.toString());
        });
    }

    if(!skipWhich.includes("date")) {
        it("updates type=date values", async () => {
            render(componentFactory());
            const d = randDate();
            d.setUTCHours(0, 0, 0, 0);
        
            const fmt = `${fmtDP(d.getUTCFullYear(), 4)}-${fmtDP(d.getUTCMonth() + 1)}-${fmtDP(d.getUTCDate())}`;
        
            await user.clear(screen.getByTestId("date"));
            await user.type(screen.getByTestId("date"), fmt);
            expectMirrorText("date").toBe(d.toUTCString());
        });
    }

    if(!skipWhich.includes("datetime-local")) {
        it("updates type=datetime-local values", async () => {
            render(componentFactory());
            const d = randDate();
            const fmt = `${fmtDP(d.getFullYear(), 4)}-${fmtDP(d.getMonth() + 1)}-${fmtDP(d.getDate())}T${fmtDP(d.getHours())}:${fmtDP(d.getMinutes())}:${fmtDP(d.getSeconds())}.${d.getMilliseconds()}`;
    
            fireEvent.change(screen.getByTestId("datetime-local"), {
                target: {
                    value: fmt
                }
            });
    
            expectMirrorText("datetime-local").toBe(d.toUTCString());
        });
    }

    if(!skipWhich.includes("checkbox")) {
        it("updates type=checkbox values", async () => {
            render(componentFactory());
        
            await user.click(screen.getByTestId("checkbox"));
            expectMirrorText("checkbox").toBe("true");
        });
    }
}