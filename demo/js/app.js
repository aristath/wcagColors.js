var colorApp = {

	/**
	 * The background color.
	 */
	backgroundColor: '#ffffff',

	/**
	 * The text color.
	 */
	textColor: '#000000',

	/**
	 * Links color.
	 */
	linksColor: '#0256b0',

	/**
	 * The hue for link colors.
	 */
	linksColorHue: 211,

	/**
	 * An array of all colors for this hue.
	 *
	 * @since 1.0
	 * @var {Array}
	 */
	allLinkHueColors: false,

	/**
	 * An object containing the accessible link colors for AAA, AA & A compliance.
	 *
	 * @since 1.0
	 * @var {Object}
	 */
	linkColors: {},

	/**
	 * Init everything we need.
	 * 
	 * @returns {void}
	 */
	init: function () {
		this.initColorPicker();
		this.initHueSlider();
		this.recalcColors();
		this.updateLinkColors();
		this.updateLinksColorIndicator();
	},

	/**
	 * Init the background-color control.
	 * 
	 * @returns {void}
	 */
	initColorPicker: function () {
		var backgroundColorPicker = document.querySelector('#color-picker-container');
		backgroundColorPicker.addEventListener('input', this.onBackgroundColorChange, false);
		backgroundColorPicker.addEventListener('change', this.onBackgroundColorChange, false);
	},

	/**
	 * Init hue slider for links color.
	 *
	 * @returns {void}
	 */
	initHueSlider: function () {
		jQuery('#hue-slider').slider({
			min: 0,
			max: 359,
			value: colorApp.linksColorHue,
			slide: function () {
				colorApp.changeHue(jQuery('#hue-slider').slider('value'));
			},
			change: function () {
				colorApp.changeHue(jQuery('#hue-slider').slider('value'));
			}
		});
	},

	/**
	 * Update color from the hue picker.
	 *
	 * @param {int} value - The hue.
	 */
	changeHue: function (value) {
		colorApp.linksColorHue = value;
		colorApp.linksColor = 'hsl(' + colorApp.linksColorHue + ',100%,50%)';
		colorApp.linksColorHue = colorApp.linksColorHue;
		colorApp.updateLinkColors();
		colorApp.updateLinksColorIndicator();
		colorApp.recalcColors();
	},

	/**
	 * Handles change events for the background-color picker.
	 * 
	 * @param {Object} event The color input change event.
	 * @returns {void}
	 */
	onBackgroundColorChange: function (event) {
		colorApp.backgroundColor = event.target.value;
		colorApp.recalcColors();
	},

	/**
	 * Recalculate all colors.
	 *
	 * @returns {void}
	 */
	recalcColors: function () {
		colorApp.updateTextColor();
		colorApp.updateLinkColors();
		colorApp.updateLinkColorsMarkup();
		colorApp.updateTextColorIndicator();
		colorApp.updateLinksColorIndicator();
	},

	/**
	 * Updates the textcolor.
	 *
	 * @returns {void}
	 */
	updateTextColor: function () {
		var backgroundColorProps = wcagColors.getColorProperties(colorApp.backgroundColor),
			textColors = wcagColors.getAll({
				color: colorApp.backgroundColor,
				minHueDiff: 0,
				maxHueDiff: 20,
				stepHue: 10,
				minSaturation: 0,
				maxSaturation: 0.3,
				stepSaturation: 0.1,
				stepLightness: 0.1,
				minLightness: 0.5 < backgroundColorProps.l ? 0 : 0.5,
				maxLightness: 0.5 < backgroundColorProps.l ? 0.5 : 1
			}).pluck({
				color: colorApp.backgroundColor,
				minContrast: 4.5
			}).sortBy('contrast').getHexArray(),
			altColorsContainer = jQuery('.altTextColors');

		if (colorApp.backgroundColor && textColors[0]) {

			// Change background color.
			document.querySelector('#preview').style.backgroundColor = this.backgroundColor;

			this.textColor = textColors[0];

			// Change text color.
			document.querySelector('#preview').style.color = this.textColor;

			// Update alternative colors.
			jQuery('.altTextColors').html('');
			jQuery.each(textColors, function (i, aColor) {
				if (i <= 299) {
					altColorsContainer.append('<button class="altColor" data-color="' + aColor + '" style="background-color:' + aColor + ';color:' + colorApp.backgroundColor + ';" title="' + aColor + '"><span>' + aColor + '</span></button>');
				}
			});

			setTimeout(function () {
				jQuery('.altColor').on('click', function (e) {
					colorApp.textColor = this.getAttribute('data-color');
					colorApp.updateTextColorIndicator();
					document.querySelector('#preview').style.color = colorApp.textColor;
				});
			}, 100);
		}
	},

	/**
	 * Gets accessible colors accoring to their rating.
	 *
	 * @param {string} rating - Can be AAA, AA or A.
	 * @returns {Array}
	 */
	queryColors: function (rating) {
		var backgroundMinContrast,
			surroundingTextMinContrast,
			backgroundColorProps = wcagColors.getColorProperties(colorApp.backgroundColor);

		switch (rating) {
			case 'AAA':
				backgroundMinContrast = 7;
				surroundingTextMinContrast = 3;
				break;
			case 'AA':
				backgroundMinContrast = 4.5;
				surroundingTextMinContrast = 2;
				break;
			case 'A':
				backgroundMinContrast = 3;
				surroundingTextMinContrast = 1;
				break;
		}

		if (!this.allLinkHueColors) {
			this.allLinkHueColors = wcagColors.getAll({
				hue: this.linksColorHue,
				minHueDiff: 0,
				maxHueDiff: 3,
				stepDiff: 3,
				stepSaturation: 0.05,
				stepLightness: 0.05,
				minLightness: 0.5 < backgroundColorProps.l ? 0 : 0.5,
				maxLightness: 0.5 < backgroundColorProps.l ? 0.5 : 1
			});
		}

		return this.allLinkHueColors.pluck({ // We want our color to have a minimum contrast of 7:1 with a white background.
				color: colorApp.backgroundColor,
				minContrast: backgroundMinContrast
			}).pluck({ // We want our color to have a minimum contrast of 3:1 with surrounding black text.
				color: colorApp.textColor,
				minContrast: surroundingTextMinContrast
			})
			.sortBy('s') // Sort colors by contrast.
			.getHexArray();
	},

	/**
	 * Updates the colorApp.allLinkHueColors and colorApp.linkColors attributes.
	 *
	 * @since 1.0
	 * @param {bool} updateValue - Whether we should update the selection or not.
	 * @returns {void}
	 */
	updateLinkColors: function () {
		var i;
		this.allLinkHueColors = false;
		this.linkColors = {
			AAA: this.queryColors('AAA'),
			AA: this.queryColors('AA'),
			A: this.queryColors('A')
		};

		// Remove duplicates from AA list.
		for (i = 0; i < this.linkColors.AAA.length; i++) {
			this.linkColors.AA.splice(this.linkColors.AA.indexOf(this.linkColors.AAA[i]), 1);
		}
	},

	/**
	 * Get the best available color for a11y.
	 *
	 * @since 1.0
	 * @returns {string}
	 */
	getBest: function () {
		if (this.linkColors.AAA[0]) {
			return this.linkColors.AAA[0];
		}
		if (this.linkColors.AA[0]) {
			return this.linkColors.AA[0];
		}
		if (this.linkColors.A[0]) {
			return this.linkColors.A[0];
		}
	},

	/**
	 * Updates the preview and markup for the links colors.
	 */
	updateLinkColorsMarkup: function () {
		var altColorsContainer = jQuery('.altLinkColors');

		colorApp.linksColor = colorApp.getBest();

		// Change link color.
		document.querySelector('#linkPreview').style.color = colorApp.linksColor;

		// Update the indicator.
		colorApp.updateLinksColorIndicator();

		// Update alternative colors.
		jQuery('.altLinkColors').html('');
		jQuery.each(colorApp.linkColors.AAA, function (i, color) {
			altColorsContainer.append('<button class="altLinkColor rating-aaa" data-color="' + color + '" style="background-color:' + color + ';color:' + colorApp.backgroundColor + ';" title="' + color + '"><span>' + color + '</span></button>');
		});
		jQuery.each(colorApp.linkColors.AA, function (i, color) {
			altColorsContainer.append('<button class="altLinkColor rating-aa" data-color="' + color + '" style="background-color:' + color + ';color:' + colorApp.backgroundColor + ';" title="' + color + '"><span>' + color + '</span></button>');
		});
		jQuery.each(colorApp.linkColors.A, function (i, color) {
			altColorsContainer.append('<button class="altLinkColor rating-a" data-color="' + color + '" style="background-color:' + color + ';color:' + colorApp.backgroundColor + ';" title="' + color + '"><span>' + color + '</span></button>');
		});

		setTimeout(function () {
			jQuery('.altLinkColor').on('click', function (e) {
				colorApp.linksColor = this.getAttribute('data-color');
				colorApp.updateLinksColorIndicator();
				document.querySelector('#linkPreview').style.color = colorApp.linksColor;
			});
		}, 100);
	},

	updateTextColorIndicator: function () {
		var textColorIndicator = '',
			textColorContrast,
			textContrastRating = '-';

		textColorContrast = wcagColors.getContrast(
			wcagColors.getColorProperties(colorApp.backgroundColor).lum,
			wcagColors.getColorProperties(colorApp.textColor).lum
		);
		textColorIndicator += 'Text Color: <code>' + colorApp.textColor + '</code>';
		textColorIndicator += ' Contrast with background-color: ' + textColorContrast;
		if (textColorContrast >= 7) {
			textContrastRating = 'AAA';
		} else if (textColorContrast >= 4.5) {
			textContrastRating = 'AA';
		}
		textColorIndicator += ' Text contrast rating: ' + textContrastRating;
		jQuery('.selectedTextColorIndicator').html(textColorIndicator);
	},

	updateLinksColorIndicator: function () {
		var linksColorIndicator = '',
			linksColorSpecs = colorApp.getLinksColorSpecs();

		linksColorIndicator += 'Links Color: <code>' + colorApp.linksColor + '</code>';
		jQuery('.selectedLinksColorIndicator').html('');
		if (colorApp.backgroundColor && colorApp.linksColor) {
			linksColorIndicator += ' Links contrast with background-color: ' + linksColorSpecs[0];
		}
		if (colorApp.textColor && colorApp.linksColor) {
			linksColorIndicator += ' Links contrast with surrounding text: ' + linksColorSpecs[1];
		}
		linksColorIndicator += ' Links rating: ' + linksColorSpecs[2];
		jQuery('.selectedLinksColorIndicator').html(linksColorIndicator);
	},

	getLinksColorSpecs: function (color) {
		var specs = [0, 0, '-'];
		color = color || colorApp.linksColor;
		specs[0] = wcagColors.getContrast(
			wcagColors.getColorProperties(colorApp.backgroundColor).lum,
			wcagColors.getColorProperties(color).lum
		);

		specs[1] = wcagColors.getContrast(
			wcagColors.getColorProperties(colorApp.textColor).lum,
			wcagColors.getColorProperties(color).lum
		);

		if (specs[0] >= 7 && specs[1] >= 3) {
			specs[2] = 'AAA';
		} else if (specs[0] >= 4.5 && specs[1] >= 3) {
			specs[2] = 'AA';
		} else if (specs[0] >= 3) {
			specs[2] = 'A';
		}
		return specs;
	}
};

colorApp.init();