
# 🔗 react-databind
react-databind is a simple and flexible data-binding system for the React web library.

## 📦 Usage
The library provides a Hook that sets up a data-binding over a state object:
```js
const [state, setState, dataBind, bindedTo] = useDataBindings({
    textual: "",
    numeric: 0,
    date: new Date(),
    checkbox: false
});
```

Similarly to the built-in `useState` React Hook, `useDataBindings` returns an array of functions that can be deconstructed to local variables. You are free to name these variables however you want, as is the case with any other React Hook.

A minimal demonstration for two text fields:
```jsx
{ /* Multi-bind flavor */ }
{dataBind(
	<div data-bind-children>
		<span>First name:</span>
		<input data-bind name="firstName" type="text"/>
		
		<span>Last name:</span>
		<input data-bind name="lastName" type="text"/>
	</div>
)};

{ /* Single-bind flavor */ }
<div>
	<span>First name:</span>
	{dataBind(<input data-bind name="firstName" type="text"/>)}
	
	<span>Last name:</span>
	{dataBind(<input data-bind name="lastName" type="text"/>)}
</div>

{ /* Prop-bind flavor */ }
<div>
	<span>First name:</span>
	<input type="text" {...bindedTo("firstName", "onChange", "value")}/>
	
	<span>Last name:</span>
	<input type="text" {...bindedTo("lastName", "onChange", "value")}/>

    { /* --- OR, with helper functions: --- */}
    <span>Middle name:</span>
	<input type="text" {...bindedTo(...bindingInput("middleName", "text"))}/>
</div>
```
<sup>*(using different data types is similarly as trivial - examples are given below)*</sup>

Let's take a look at the array returned by the hook that we have deconstructed in the example; the first two variables are functionally identical to the `useState` functions. The last two variables define two ways to data bind elements:
- `DataBindTransformer`: accepts a single element, and transforms it, so that it contains one or more data bindings. If the element contains a `data-bind` attribute, only it is affected, and its children are copied over - if the element contains a `data-bind-children` attribute, only its children are affected. If the element is missing both of these attributes, an error is thrown.
- `DataBindPropertyProvider`: accepts a name, a callback, and optionally a data selector, and returns properties for the element, that then can be applied using the spread (`{...<object>}`) operator.

> **Warning**: 
> The prop-bind syntax, using `DataBindPropertyProvider`, is limited in that it cannot automatically detect elements such as `<input>` - this means that for types such as `date`, you'll have to provide your own implementation of a data selector and state transformer, that would stringify and parse the `Date`. This only applies if the state member and the element value are of different types - if they are the same types, no data selector/state transformer is necessary.

The behavior of these functions is described below.

### Binding w/ `DataBindTransformer`
The `DataBindTransformer` function type expects the given element (in the case of `data-bind`) or the child elements (in the case of `data-bind-children`) to contain the following properties:
- `data-bind` - required to mark the parent element/child elements that should be data-binded.
- `data-bind-callback` - required in the case of e.g. Components. Specifies the function that is called whenever the given element's value is modified. For elements such as `<input>`, this is not required, as the library will automatically detect such elements, and will automatically set the bindings for these elements for automatic type conversion.
- `data-bind-property` - specifies the property that stores the value of the element. Not required if the element is read-only or does not provide such a property, or if it's a known element (e.g. `<input>`).
- `data-bind-selector` - specifies the data selector. See `DataBindPropertyProvider.dataSelector?` for more information.
- `data-bind-state-fn` - specifies the mapping/transformer function for the state member to the data-binded element property. See `DataBindPropertyProvider.stateTransformer?` for more information.

> **Note**:
> Specifying a component without a defined "name" property is possible by using the `bindedWithName` import and using the spread operator to merge the members returned by the function with the properties of the component.

### Binding w/ `DataBindPropertyProvider`
The `DataBindPropertyProvider` takes the following arguments:
- `name` - the name of the element, also corresponding to the state member name
- `bindCallback` - the name of the property that the element calls whenever its value is updated
- `bindProperty?` - optional; the name of the property that allows for modification of the elements value. Not required if the element is not intended to be modified by code, or if the element does not provide such a property.
- `dataSelector?` - optional; a function that is called to transform the received data of `bindCallback` to a value that can be assigned to the state member. If not specified, and the data type is unrecognized, an [identity function](https://en.wikipedia.org/wiki/Identity_function) is used.
- `stateTransformer?` - optional; a function that is called to transform the data fetched from the `state` to a value that can be assigned to the state member. If not specified, the `state` value is not transformed.

When using `<input>` elements, you can use the `bindingInput` helper method instead of providing your own state-element mappers:
```jsx
<input data-testid="date" type="date"
    {...bindedTo(...bindingInput("myDateValue", "date"))}></input>
```
...where the first argument specifies the name, and the second one specifies the type of the `<input>` element that the return value of `bindedTo` will be merged to.

### Example: Binding elements
```jsx
export function MainPage() {
    const [queryFields, setQueryFields, dataBind, bindTo] = useDataBindings({
        firstName: "Elliot",
        lastName: "Alderson",
        hue: 0,
        date: new Date(2012, 11, 13),
        files: [],
        freeformText: "",
        numOne: 1,
        numTwo: 2,
        custom: "",
        customReadonly: "",
        petName: ""
    });

    const renderQueryFields = () => {
        return (
            <div>
                { /* Multi-bind syntax flavor */}
                {dataBind(
                    <div data-bind-children className="input-group">
                        <div>
                            <span>First name</span>
                            <input data-bind name="firstName" type="text"></input>
                        </div>

                        <div>
                            <span>Last name</span>
                            <input data-bind name="lastName" type="text"></input>
                        </div>
                    </div>
                )}

                { /* Single-bind syntax flavor */}
                <div>
                    <span>Hue</span>
                    {dataBind(<input data-bind name="hue" type="range" min="0" max="360"></input>)}
                </div>


                { /* Prop-bind syntax flavor */}
                <div>
                    { /* If the types of the state member and the value attribute match, there's no need for auxillary functions. */}
                    <span>Favorite pet</span>
                    <input type="text" {...bindTo("petName", "onChange", "value")}></input>

                    <br/>

                    { /* You can use either camelCase and kebab-case; the library will normalize the names. */}
                    <input type="number"
                        {...bindTo("num-one", "onChange", "value", x => parseFloat(x.currentTarget.value), x => isNaN(x) ? "" : x.toString())}>
                    </input>

                    <span>+</span>

                    <input type="number"
                        {...bindTo(...bindingInput("num-one", "number"))}>
                    </input>
                </div>

                {dataBind(
                <div data-bind-children>
                    { /* The library can automatically convert between types on built-in HTML elements. */}

                    <div>
                        { /* A type="files" element is automatically binded to the correct type, changing from a FileList to a File[] on the fly. */ }
                        <span>Files</span>
                        <input data-bind name="files" type="file" multiple></input>
                    </div>

                    <div>
                        { /* Elements such as textarea are also handled by the library. */ }
                        <span>Text</span>
                        <textarea data-bind name="freeform-text"></textarea>
                    </div>

                    <div>
                        { /* Elements without the data-bind property are not affected. */}
                        <span>Unbound Field</span>
                        <input name="unbound" type="text"></input>
                    </div>

                    <div>
                        { /* Binding elements with the common data callback pattern is also possible. If the component returns a different type than what you want the state member to be, please use DataBindPropertyProvider. */ }
                        <span>Custom Component</span>
                        <MyOwnInput data-bind
                            data-bind-callback="passData"
                            data-bind-property="value"
                            name="custom"
                        ></MyOwnInput>
                    </div>

                    { /* If you don't need to write to the element's value, you can omit "data-bind-property". This is also useful for components that don't feature a writeable property like "value".
                    Please note that the component will have to implement its own data storage, e.g. w/ useState. */ }
                    <div>
                        <span>Read-only Custom Component</span>
                        <MyOwnInput data-bind name="custom-readonly" data-bind-callback="passData"></MyOwnInput>
                    </div>
                </div>
                )}
            
                <p>Hello, {queryFields.firstName} {queryFields.lastName}.</p>
                <p>Lorem ipsum, <span style={{ color: `hsl(${queryFields.hue}deg 100% 50%)` }}>dolor sit amet.</span></p>
                <p>Your favorite pet is a {queryFields.petName}.</p>
                <p>{queryFields.files.length} files uploaded: {queryFields.files.map(x => x.name).join() }</p>
                <p>{queryFields.freeformText}</p>
                <p>{queryFields.numOne} + {queryFields.numTwo} = {queryFields.numOne + queryFields.numTwo}</p>
                <p>The custom component reports { queryFields.custom } as the value.</p>
                <p>The read-only component reports { queryFields.customReadonly } as the value.</p>

                <button onClick={ redact }>Redact</button>
            </div >
        )
    }

    // An example of synchronization between the state and UI
    const redact = () => {
        setQueryFields({
            ...queryFields,
            firstName: "[REDACTED]",
            lastName: "[REDACTED]",
            hue: Math.floor(Math.random() * 360),
            custom: "hi!", // The UI element will change, as its binded with a property...
            customReadonly: "hi!", // ...this one, however, will not.
            // Other fields are not changed as a demonstration.
        });
    }

    return <div>{renderQueryFields()}</div>;
}
```
<sup>*(get the code for the custom component [here](https://gist.github.com/ascpixi/6b820f015d9aaa956c8011353d1c6d8b)*)</sup>

## 💾 Installing
In order to install react-databind from the latest version from this repository, in the directory where `package.json` resides, type:
- **yarn**: `yarn add https://github.com/ascpixi/react-databind`
- **npm**: `npm add git+https://github.com/ascpixi/react-databind.git`

## 🔨 Building
react-databind uses **yarn** as its package manager. Use the following commands to:
- build: `yarn build`
- test: `yarn build && yarn test`
- publish to NPM: `npm publish`
- package to local tarball: `npm pack`