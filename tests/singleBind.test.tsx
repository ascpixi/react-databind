import * as React from "react"
import "jest-canvas-mock"

import { useDataBindings } from "../src"

import { testInputElement } from './inputElementTestSuite';

function TestComponent() {
    const [state,, dataBind] = useDataBindings({
        textual: "FAIL",
        numeric: 0,
        date: new Date(),
        datetimeLocal: new Date(),
        checkbox: false
    });

    return (
        <div>
            <div>
                {dataBind(<input data-bind data-testid="textual" type="text" name="textual" />)}
                {dataBind(<input data-bind data-testid="numeric" type="number" name="numeric" />)}
                {dataBind(<input data-bind data-testid="date" type="date" name="date" />)}
                {dataBind(<input data-bind data-testid="datetime-local" type="datetime-local" name="datetime-local" />)}
                {dataBind(<input data-bind data-testid="checkbox" type="checkbox" name="checkbox" />)}
            </div>

            <div>
                <p data-testid="textual-mirror">{state.textual}</p>
                <p data-testid="numeric-mirror">{state.numeric}</p>
                <p data-testid="date-mirror">{state.date.toUTCString()}</p>
                <p data-testid="datetime-local-mirror">{state.datetimeLocal.toUTCString()}</p>
                <p data-testid="checkbox-mirror">{state.checkbox ? "true" : "false"}</p>
            </div>
        </div>
    );
}

describe("<input> elements, single-bind", () => {
    testInputElement(() => <TestComponent></TestComponent>);
});