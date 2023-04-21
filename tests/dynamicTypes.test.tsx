import * as React from "react"
import { render, screen } from "@testing-library/react"

import "jest-canvas-mock"

import { useDataBindings } from "../src"

import userEvent from "@testing-library/user-event";
import failOnConsole from "jest-fail-on-console";
import { expectMirrorText } from "./testUtils";

function TestComponent() {
    const [state, setState, dataBind, bindTo] = useDataBindings({
        val: "LIAF 1",
        childTest: "LIAF 1",
    });

    const stateTransform = (x: string) => {
        return x.split("").reverse().join("");
    }

    const callbackTransform = (ev: React.SyntheticEvent<HTMLInputElement, InputEvent>) => {
        return ev.currentTarget.value.split("").reverse().join("");
    }

    const handleChangeClick = () => {
        setState({ val: "devil", childTest: "devil" });
    }

    return (
        <div>
            <div>
                <input data-testid="textual" type="text"
                        {...bindTo("val", "onChange", "value", callbackTransform, stateTransform) }/>

                {dataBind(
                <div data-bind-children>
                    <input data-bind data-testid="childTest" type="text"
                        name="childTest" data-bind-callback="onChange" data-bind-property="value"
                        data-bind-selector={callbackTransform} data-bind-state-fn={stateTransform}
                    />
                </div>
                )}

            </div>

            <div>
                <p data-testid="textual-mirror">{state.val}</p>
                <p data-testid="childTest-mirror">{state.childTest}</p>
                <button data-testid="change" onClick={handleChangeClick}>Change value</button>
            </div>
        </div>
    );
}

describe("Dynamic data type selector/transformer", () => {
    failOnConsole({ shouldFailOnWarn: false });
    const user = userEvent.setup({
        delay: 60 / 1000,
    });

    it("binds successfully", () => {
        render(<TestComponent></TestComponent>);
    });

    it("updates values", async () => {
        render(<TestComponent></TestComponent>);

        await user.clear(screen.getByTestId("textual"));
        await user.type(screen.getByTestId("textual"), "drawer");
        expectMirrorText("textual").toBe("reward");
    });

    it("updates values when binding children", async () => {
        render(<TestComponent></TestComponent>);

        await user.clear(screen.getByTestId("childTest"));
        await user.type(screen.getByTestId("childTest"), "drawer");
        expectMirrorText("childTest").toBe("reward");
    });

    it("reflects in-code changes", async () => {
        render(<TestComponent></TestComponent>);

        await user.click(screen.getByTestId("change"));
        expectMirrorText("textual").toBe("devil");
        expect((screen.getByTestId("textual") as HTMLInputElement).value).toBe("lived");
    });

    it("reflects in-code changes when binding children", async () => {
        render(<TestComponent></TestComponent>);

        await user.click(screen.getByTestId("change"));
        expectMirrorText("childTest").toBe("devil");
        expect((screen.getByTestId("childTest") as HTMLInputElement).value).toBe("lived");
    });
});