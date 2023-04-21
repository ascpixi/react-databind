import * as React from "react"
import "jest-canvas-mock"

import { bindingInput, useDataBindings } from "../src"

import { testInputElement } from './inputElementTestSuite';

function TestComponent() {
    const [state,,,bindedTo] = useDataBindings({
        textual: "FAIL",
        numeric: 0,
        checkbox: false,
        date: new Date("2012-12-12")
    });

    return (
        <div>
            <div>
                <input data-testid="textual" type="text"
                    {...bindedTo("textual", "onChange", "value")}
                />

                <input data-testid="numeric" type="number"
                    {...bindedTo("numeric", "onChange", "value")}
                />

                <input data-testid="checkbox" type="checkbox"
                    {...bindedTo("checkbox", "onChange", "checked")}
                />

                <input data-testid="date" type="date"
                    {...bindedTo(...bindingInput("date", "date"))}></input>
            </div>

            <div>
                <p data-testid="textual-mirror">{state.textual}</p>
                <p data-testid="numeric-mirror">{state.numeric}</p>
                <p data-testid="checkbox-mirror">{state.checkbox ? "true" : "false"}</p>
                <p data-testid="date-mirror">{state.date.toUTCString()}</p>
            </div>
        </div>
    );
}

describe("<input> elements, prop-bind", () => {
    testInputElement(
        () => <TestComponent></TestComponent>,
        ["datetime-local"]
    );
});