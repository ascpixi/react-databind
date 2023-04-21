import React, { useState } from "react";
import { bindedWithName, useDataBindings } from "../src";
import failOnConsole from "jest-fail-on-console";
import { testCustomComponent } from "./customComponentTestSuite";

function CustomWriteableComponent({ value, passData }) {
    const handleKeyPress = (ev: React.KeyboardEvent<HTMLElement>) => {
        if (ev.key == "Backspace") {
            value = value.substring(0, value.length - 1);
        } else if(ev.key.length == 1) {
            value = value + ev.key;
        }

        if(passData) passData(value);
    }

    return (
        <div tabIndex={0} data-testid="cmp" className="my-own-input" onKeyDown={handleKeyPress}>
            <span data-testid="cmp-content" className="content">{ value }</span>
        </div>
    );
}

function CustomReadonlyComponent({ passData }) {
    let [value, setStateValue] = useState("");

    const handleKeyPress = (ev: React.KeyboardEvent<HTMLElement>) => {
        if (ev.key == "Backspace") {
            value = value.substring(0, value.length - 1);
        } else if(ev.key.length == 1) {
            value = value + ev.key;
        }

        setStateValue(value);
        if(passData) passData(value);
    }

    return (
        <div tabIndex={0} data-testid="cmp" className="my-own-input" onKeyDown={handleKeyPress}>
            <span data-testid="cmp-content" className="content">{ value }</span> <span className="caret"></span>
        </div>
    );
}

function TestComponentWriteableSingle() {
    const [state, setState, dataBind,] = useDataBindings({ cc: "" });

    return (
        <div>
            <div>
                {dataBind(<CustomWriteableComponent
                    data-bind-callback="passData"
                    data-bind-property="value"
                    {...bindedWithName("cc")}
                ></CustomWriteableComponent>)}
            </div>
            
            <p data-testid="cmp-content-mirror">{ state.cc }</p>
            <button data-testid="write" onClick={() => setState({ cc: "WRITE SUCCESS" })}>Write</button>
        </div>
    )
}

function TestComponentReadonlySingle() {
    const [state,, dataBind] = useDataBindings({ cc: "" });

    return (
        <div>
            <div>
                {dataBind(<CustomReadonlyComponent
                    data-bind-callback="passData"
                    {...bindedWithName("cc")}
                ></CustomReadonlyComponent>)}
            </div>
            
            <p data-testid="cmp-content-mirror">{ state.cc }</p>
        </div>
    )
}

function TestComponentWriteableMulti() {
    const [state, setState, dataBind] = useDataBindings({ cc: "" });

    return (
        <div>
            <div>
                {dataBind(
                    <div data-bind-children>
                        <CustomWriteableComponent
                            data-bind-callback="passData"
                            data-bind-property="value"
                            {...bindedWithName("cc")}
                        ></CustomWriteableComponent>
                    </div>
                )}
            </div>
            
            <p data-testid="cmp-content-mirror">{ state.cc }</p>
            <button data-testid="write" onClick={() => setState({ cc: "WRITE SUCCESS" })}>Write</button>
        </div>
    )
}

function TestComponentReadonlyMulti() {
    const [state,,dataBind] = useDataBindings({ cc: "" });

    return (
        <div>
            <div>
                {dataBind(<div data-bind-children>
                    <CustomReadonlyComponent
                        data-bind-callback="passData"
                        {...bindedWithName("cc")}
                    ></CustomReadonlyComponent>
                </div>)}
            </div>
            
            <p data-testid="cmp-content-mirror">{ state.cc }</p>
        </div>
    )
}

function TestComponentWriteableProp() {
    const [state, setState,, bindedTo] = useDataBindings({ cc: "" });

    return (
        <div>
            <div>
                <CustomWriteableComponent
                    {...bindedTo("cc", "passData", "value")}
                ></CustomWriteableComponent>
            </div>
            
            <p data-testid="cmp-content-mirror">{ state.cc }</p>
            <button data-testid="write" onClick={() => setState({ cc: "WRITE SUCCESS" })}>Write</button>
        </div>
    )
}

function TestComponentReadonlyProp() {
    const [state,,, bindedTo] = useDataBindings({ cc: "" });

    return (
        <div>
            <div>
                <CustomReadonlyComponent
                    {...bindedTo("cc", "passData")}
                ></CustomReadonlyComponent>
            </div>
            
            <p data-testid="cmp-content-mirror">{ state.cc }</p>
        </div>
    )
}

describe("Custom components", () => {
    failOnConsole({ shouldFailOnWarn: false });

    testCustomComponent(
        "writeable, single-bind", true,
        () => <TestComponentWriteableSingle></TestComponentWriteableSingle>
    );

    testCustomComponent(
        "writeable, multi-bind", true,
        () => <TestComponentWriteableMulti></TestComponentWriteableMulti>
    );

    testCustomComponent(
        "writeable, prop-bind", true,
        () => <TestComponentWriteableProp></TestComponentWriteableProp>
    );

    testCustomComponent(
        "read-only, single-bind", false,
        () => <TestComponentReadonlySingle></TestComponentReadonlySingle>
    );

    testCustomComponent(
        "read-only, multi-bind", false,
        () => <TestComponentReadonlyMulti></TestComponentReadonlyMulti>
    );

    testCustomComponent(
        "read-only, prop-bind", false,
        () => <TestComponentReadonlyProp></TestComponentReadonlyProp>
    );
});