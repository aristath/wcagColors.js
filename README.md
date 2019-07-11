# wcagColors.js

`wcagColors` is a simple script that allows you to add some criteria and get an array of colors that match those criteria. It was built as a way to get color combinations that comply with WCAG rules, but can be used for other purposes since you provide your own rules and it doesn't have hardcoded values.

It was conceived while building custom WCAG-related controls for the WordPress Customizer for [wplemon.com](https://wplemon.com).

It is vanilla JS with no dependencies whatsoever and its size gzipped is less than 4Kb so you can use it without adding any bloat to your projects.

## Structure

`wcagColors` is a JS object with a few functions that are chainable.
The functions documented below return a copy of the `wcagColors` object with the `wcagColors.colors` property modified according to the arguments you provide.

## Example

In this example we assume that we have a white background color, black text, and we want to get a color that we'll use for our links. In order for our color to be WCAG 2.0 compliant it should have a minimum contrast of 7:1 with our white background and a minimum contrast of 3:1 with surrounding text.

```js
var colors = wcagColors.getAll({ // Populate the initial pool of colors.
    color: '#0000ff',
    minHueDiff: 0,
    maxHueDiff: 10,
    stepHue: 5,
    minSaturation: 0.4,
    maxSaturation: 1,
    stepSaturation: 0.05,
    minLightness: 0,
    maxLightness: 1.001,
    stepLightness: 0.05,
}).pluck({ // We want our color to have a minimum contrast of 7:1 with a white background.
    color: '#ffffff',
    minContrast: 7
}).pluck({ // We want our color to have a minimum contrast of 3:1 with surrounding black text.
    color: '#000000',
    minContrast: 3
})
.sortBy( 's' ) // Sort colors by saturation.
.getHexArray(); // get the array of colors.
```

The above code will return an array of colors that fulfil the following criteria:
* Has a minimum contrast of 3:1 with `#000`.
* Has a minimum contrast of 7:1 with `#fff`.
* Has a maximum difference in hue with `#0000ff` of 10 degrees.
* Has a minimum saturation of `0.4`.
* Has a maximum saturation of `1`.

How detailed the search for colors is is determined by the `stepHue`, `stepSaturation` and `stepLightness` arguments.

The result is an array containing 11 colors, sorted by their saturation levels:
```js
[
    "#4f30e8",
    "#5336e2",
    "#493cdd",
    "#573cdd",
    "#4242d7",
    "#4e42d7",
    "#4747d1",
    "#5046b9",
    "#5946b9",
    "#4c4cb3",
    "#554cb3",
];
```

## Functions:

### `getAll()`

The `wcagColors.getAll()` function gets a copy of the object with the `wcagColors.colors` array populated according to the function parameters. It is the first function that should always run.
A `color` or `hue` argument must be provided as a basis.

```js
var colors = wcagColors.getAll({
    color: '#333', // A color formatted as RGB, HSL or HEX.
    // hue: 100, // If a color is not provided, we can alternatively provide a hue.
    minSaturation: 0, // The minimum saturation the returned colors can have (0-1).
    maxSaturation: 1, // The maximum saturation the returned colors can have (0-1).
    stepSaturation: 0.1, // The increments in saturation while populating for colors (0-1).
    stepLightness: 0.1, // Each lightness step. Smaller numbers are more detailed but slower.
    minHueDiff: 0, // The minimum hue difference (0-359).
    maxHueDiff: 359, // The maximum hue difference (0-359).
    stepHue: 15 // How many degrees to turn the colorwheel on each iteration.
});
```

### `pluck()`

The `wcagColors.pluck()` function returns a copy of the `wcagColors` object with the `wcagColors.colors` array modified according to the criteria provided. It can be chaned after the `wcagColors.getAll()` function to pluck the populated colors that meet our demands.

```js
var colorsReadableOnWhite = colors.pluck({
    color: '#ffffff',
    minContrast: 7 // The minimum contrast required (0-21).
    // minHueDiff: 0 // In some cases (like when looking for links colors) we may require a minimum hue difference (0-359).
    // maxHueDiff: 359 // Maximum hue difference.
});
```

### `sortBy()`

The `wcagColors.sortBy()` function allows us to sort the `wcagColors.colors` array depending on what we want.

It accept a single string argument which represets how we want to sort the colors. The acceptable values for this argument are the following:
* `r`, `g` or `b` if we want to sort colors based on the values of red, green & blue.
* `h`, `s` or `l` if we want to sort colors based on their hue, saturation or lightness.
* `lum` if we want to sort colors based on their luminance.
* `contrast` if we want to sort colors based on their contrast with the color provided in the `pluck` function chaned before. Please note that this is only available if the `pluck` function used a `minContrast` parameter.

```js
var colorsReadableOnWhiteSorted = colorsReadableOnWhite.sortBy( 'contrast' );
```

### `getHexArray()`

Returns an array of HEX colors.

```js
var colorsArray = colorsReadableOnWhiteSorted.getHexArray();
```

The object contains numerous helper functions, for more details on those you can take a look at the code on the [github repository](https://github.com/aristath/wcagColors.js/blob/master/wcagColors.js). All functions have adequate inline docs you can refer to.

## License:

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT)
