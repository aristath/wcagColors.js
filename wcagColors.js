/* jshint -W104 */

var wcagColors = function() {
	return {
		colors: [],

		/**
		 * Get all relative colors.
		 *
		 * @param {Object} params - The parameters for the colors.
		 * @param {string} params.color - A color formatted as RGB, HSL or HEX.
		 * @param {int}    params.hue - If a color is not provided, we can alternatively provide a hue.
		 * @param {float}  params.minSaturation - The minimum saturation the returned colors can have (0-1).
		 * @param {float}  params.maxSaturation - The maximum saturation the returned colors can have (0-1).
		 * @param {float}  params.stepSaturation - The increments in saturation while searching for colors (0-1).
		 * @param {float}  params.stepLightness - Each lightness step. Smaller numbers are more detailed but slower.
		 * @param {int}    params.minHueDiff - The minimum hue difference (0-359).
		 * @param {int}    params.maxHueDiff - The maximum hue difference (0-359).
		 * @param {int}    params.stepHue - How many degrees to turn the colorwheel on each iteration.
		 * @returns {Object}
		 */
		getAll( params ) {
			var allColors = [],
				hueOffset,
				hueUp,
				hueDown,
				newColors,
				i;

			// If we got a string color and not a hue make sure we get the hue.
			if ( ! params.hue && params.color ) {
				params.hue = this.getColorProperties( params.color ).h;
			}

			params.minSaturation = params.minSaturation || 0;
			params.maxSaturation = params.maxSaturation || 1;
			params.stepSaturation = params.stepSaturation || 0.1;
			params.stepLightness = params.stepLightness || 0.1;
			params.minHueDiff = params.minHueDiff || 0;
			params.maxHueDiff = params.maxHueDiff || 359;
			params.stepHue    = params.stepHue || 15;

			if ( 0 === params.maxHueDiff ) {
				return this.getAllColorsForHue( params.hue, params );
			}

			for ( hueOffset = params.minHueDiff; hueOffset <= params.maxHueDiff; hueOffset += params.stepHue ) {

				// Calculate Hue Up.
				hueUp = ( 359 < params.hue + hueOffset ) ? params.hue + hueOffset - 359 : params.hue + hueOffset;

				// Calculate Hue Down.
				hueDown = ( 0 > params.hue + hueOffset ) ? params.hue + hueOffset + 360 : params.hue + hueOffset;

				// Add colors from the UP hue.
				newColors = this.getAllColorsForHue( hueUp, params );
				for ( i = 0; i < newColors.length; i++ ) {
					if ( -1 === allColors.indexOf( newColors[ i ] ) ) {
						allColors.push( newColors[ i ] );
					}
				}

				// Add colors from the DOWN hue.
				newColors = this.getAllColorsForHue( hueDown, params );
				for ( i = 0; i < newColors.length; i++ ) {
					if ( -1 === allColors.indexOf( newColors[ i ] ) ) {
						allColors.push( newColors[ i ] );
					}
				}
			}

			return Object.assign({}, this, {
				colors: this.sortColorsByLuminance( this.removeDuplicateColors( allColors ) )
			});
		},

		/**
		 * Get an array of colors that fulfil the provided criteria.
		 *
		 * @param {Object} criteria- The provided criteria.
		 * @param {string|Object} criteria.color - The color we want to check against.
		 * @param {int} criteria.minHueDiff - Minimum hue difference required.
		 * @param {int} criteria.maxHueDiff - Maximum hue difference required.
		 * @param {int} criteria.minContrast - The minimum contrast required to pass.
		 */
		pluck( criteria ) {
			var validColors = [],
				pass,
				i;

			if ( 'string' === typeof criteria.color ) {
				criteria.color = this.getColorProperties( criteria.color );
			} else if ( criteria.color.r && criteria.color.g && criteria.color.b ) {
				criteria.color = this.getColorProperties( 'rgb(' + criteria.color.r + ',' + criteria.color.g + ',' + criteria.color.b + ')' );
			} else if ( criteria.color.h && criteria.color.s && criteria.color.l ) {
				criteria.color = this.getColorProperties( 'hsl(' + criteria.color.h + ',' + criteria.color.s + ',' + criteria.color.l + ')' );
			}

			for ( i = 0; i < this.colors.length; i++ ) {
				pass = true;

				// Minimum hue-diff check.
				if ( 'undefined' !== typeof criteria.minHueDiff && criteria.minHueDiff > Math.abs( this.colors[ i ].hue - criteria.color.hue ) ) {
					pass = false;
				}

				// Maximum hue-diff check.
				if ( 'undefined' !== typeof criteria.maxHueDiff && criteria.maxHueDiff < Math.abs( this.colors[ i ].hue - criteria.color.hue ) ) {
					pass = false;
				}

				// Minimum contrast check.
				if ( 'undefined' !== typeof criteria.minContrast ) {
					this.colors[ i ].contrast = this.getContrast( criteria.color.lum, this.colors[ i ].lum );
					if ( criteria.minContrast > this.colors[ i ].contrast ) {
						pass = false;
					}
				}

				if ( pass ) {
					validColors.push( this.colors[ i ] );
				}
			}

			return Object.assign({}, this, {
				colors: validColors
			});
		},

		/**
		 * Query a string color and get its properties.
		 *
		 * @param {string} color - The color we want to query. Can be formatted as hex, rgb, rgba, hsl, hsla.
		 * @returns {Object} - {r,g,b,h,s,l,hex,lum}.
		 */
		getColorProperties: function( color ) {
			var hex,
				rgb,
				hsl,
				col;
			if ( -1 !== color.indexOf( 'hsl' ) ) {
				col = color.replace( 'hsla', '' ).replace( '.hsl', '' ).replace( '(', '' ).replace( ')', '' ).split( ',' );
				hsl = {
					h: col[0],
					s: col[1],
					l: col[2]
				};
				rbg = this.hslToRgb( hsl.h, hsl.s, hsl.l );
				hex = this.rgbToHex( rgb.r, rgb.g, rgb.b );
			} else if ( -1 !== color.indexOf( 'rgb' ) ) {
				col = color.replace( 'rgba', '' ).replace( '.rgb', '' ).replace( '(', '' ).replace( ')', '' ).split( ',' );
				rgb = {
					r: col[0],
					g: col[1],
					b: col[2]
				};
				hsl = this.rgbToHsl( rgb.r, rgb.g, rgb.b );
				hex = this.rgbToHex( rgb.r, rgb.g, rgb.b );
			} else {
				hex = color;
				rgb = this.hexToRgb( hex );
				hsl = this.rgbToHsl( rgb.r, rgb.g, rgb.b );
			}
			return {
				r: rgb.r,
				g: rgb.g,
				b: rgb.b,
				h: hsl.h,
				s: hsl.s,
				l: hsl.l,
				hex: hex,
				lum: this.getRelativeLuminance( rgb )
			};
		},

		/**
		 * Get all colors for a given hue.
		 *
		 * @param {int} hue - The hue of the color.
		 * @param {Object} args - Additional arguments.
		 * @param {float} args.minSaturation - The minimum saturation the returned colors can have (0-1).
		 * @param {float} args.maxSaturation - The maximum saturation the returned colors can have (0-1).
		 * @param {float} args.stepSaturation - The increments in saturation while searching for colors (0-1).
		 * @param {float} args.stepLightness - Each lightness step.
		 *                                     smaller numbers are more detailed,
		 *                                     larger numbers have bigger "steps" between colors.
		 * @returns {Array}
		 */
		getAllColorsForHue: function( hue, args ) {
			var colors = [],
				saturation,
				lightness,
				color;

			args.minSaturation  = args.minSaturation || 0;
			args.maxSaturation  = args.maxSaturation || 1;
			args.stepSaturation = args.stepSaturation || 0.1;

			for ( saturation = args.minSaturation; args.maxSaturation >= saturation; saturation += args.stepSaturation ) {
				for ( lightness = 0; 1.001 >= lightness; lightness += args.stepLightness ) {
					color = this.hslToRgb( hue, saturation, lightness );
					colors.push({
						r: color.r,
						g: color.g,
						b: color.b,
						h: hue,
						s: saturation,
						l: lightness,
						hex: this.rgbToHex( color.r, color.g, color.b ),
						lum: this.getRelativeLuminance( color )
					});
				}
			}
			return colors;
		},

		/**
		 * Converts an RGB object to a HEX string.\
		 *
		 * @param {int} r - Red.
		 * @param {int} g - Green.
		 * @param {int} b - Blue.
		 */
		rgbToHex: function( r, g, b ) {
			return '#' + ( ( 1 << 24 ) + ( r << 16 ) + ( g << 8 ) + b ).toString( 16 ).slice( 1 );
		},

		/**
		 * Convert hex color to RGB.
		 * See https://stackoverflow.com/a/5624139
		 *
		 * @since 1.0
		 * @param {string} hex - The hex color.
		 * @returns {Object}
		 */
		hexToRgb: function( hex ) {
			var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
				result;

			// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF").
			hex = hex.replace( shorthandRegex, function( m, r, g, b ) {
				return r + r + g + g + b + b;
			});

			result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec( hex );
			return result ? {
				r: parseInt( result[1], 16 ),
				g: parseInt( result[2], 16 ),
				b: parseInt( result[3], 16 )
			} : null;
		},

		/**
		 * Converts an HSL color value to RGB. Conversion formula
		 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
		 * Assumes h, s, and l are contained in the set [0, 1] and
		 * returns r, g, and b in the set [0, 255].
		 *
		 * @param  {number}  h       The hue
		 * @param  {number}  s       The saturation
		 * @param  {number}  l       The lightness
		 * @return {Array}           The RGB representation
		 */
		hslToRgb: function( h, s, l ) {
			var r, g, b, hue2rgb, q, p;

			if ( 0 == s ) {
				r = g = b = l; // achromatic
			} else {
				hue2rgb = function hue2rgb( p, q, t ) {
					if ( 0 > t ) {
						t += 1;
					}
					if ( 1 < t ) {
						t -= 1;
					}
					if ( t < 1 / 6 ) {
						return p + ( q - p ) * 6 * t;
					}
					if ( t < 1 / 2 ) {
						return q;
					}
					if ( t < 2 / 3 ) {
						return p + ( q - p ) * ( 2 / 3 - t ) * 6;
					}
					return p;
				};

				q = 0.5 > l ? l * ( 1 + s ) : l + s - l * s;
				p = 2 * l - q;
				r = hue2rgb( p, q, h + 1 / 3 );
				g = hue2rgb( p, q, h );
				b = hue2rgb( p, q, h - 1 / 3 );
			}

			return {
				r: Math.round( r * 255 ),
				g: Math.round( g * 255 ),
				b: Math.round( b * 255 )
			};
		},

		/**
		 * Converts an RGB color value to HSL. Conversion formula
		 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
		 * Assumes r, g, and b are contained in the set [0, 255] and
		 * returns h, s, and l in the set [0, 1].
		 *
		 * @param   {number}  r       The red color value
		 * @param   {number}  g       The green color value
		 * @param   {number}  b       The blue color value
		 * @return  {Array}           The HSL representation
		 */
		rgbToHsl: function( r, g, b ) {
			var max,
				min,
				h,
				s,
				l,
				d;

			r /= 255;
			g /= 255;
			b /= 255;
			max = Math.max( r, g, b );
			min = Math.min( r, g, b );
			l = ( max + min ) / 2;

			if ( max === min ) {
				h = s = 0; // achromatic
			} else {
				d = max - min;
				s = 0.5 < l ? d / ( 2 - max - min ) : d / ( max + min );
				switch ( max ) {
					case r: h = ( g - b ) / d + ( g < b ? 6 : 0 ); break;
					case g: h = ( b - r ) / d + 2; break;
					case b: h = ( r - g ) / d + 4; break;
				}
				h /= 6;
			}

			return {
				h: h,
				s: s,
				l: l
			};
		},

		/**
		 * Get contrast between 2 luminosities.
		 *
		 * @since 1.0
		 * @param {float} lum1 - 1st Luminosity.
		 * @param {float} lum2 - 2nd Luminosity.
		 * @returns {float}
		 */
		getContrast: function( lum1, lum2 ) {
			return this.roundFloat( Math.max( ( lum1 + 0.05 ) / ( lum2 + 0.05 ), ( lum2 + 0.05 ) / ( lum1 + 0.05 ) ) );
		},

		/**
		 * Gets the relative luminance from RGB.
		 * Formula: http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
		 *
		 * @since 1.0
		 * @param {Object} color - an RGB color {r,g,b}.
		 * @returns {float}
		 */
		getRelativeLuminance: function( color ) {
			return this.roundFloat( 0.2126 * this.getLumPart( color.r ) + 0.7152 * this.getLumPart( color.g ) + 0.0722 * this.getLumPart( color.b ) );
		},

		/**
		 * Get luminocity for a part.
		 *
		 * @since 1.0
		 * @param {int|float} val - The value.
		 * @returns {float}
		 */
		getLumPart: function( val ) {
			val = val / 255;
			if ( 0.03928 >= val ) {
				return val / 12.92;
			}
			return Math.pow( ( ( val + 0.055 ) / 1.055 ), 2.4 );
		},

		/**
		 * Round a float.
		 * See https://stackoverflow.com/a/5624139
		 *
		 * @since 1.0
		 * @param {float} number - The number we want to round.
		 * @returns {float}
		 */
		roundFloat: function( number ) {
			return Math.round( number * 100 ) / 100;
		},

		/**
		 * Sorts an array of colors by luminance.
		 *
		 * @param {Array} colors - An array of colors.
		 * @returns {Array}
		 */
		sortColorsByContrast: function( colors ) {
			return colors.sort( function( a, b ) {
				return b.contrast - a.contrast;
			});
		},

		/**
		 * Sorts an array of colors by luminance.
		 *
		 * @param {Array} colors - An array of colors.
		 * @returns {Array}
		 */
		sortColorsByLuminance: function( colors ) {
			return colors.sort( function( a, b ) {
				return b.lum - a.lum;
			});
		},

		/**
		 * Removes duplicate entries from colors.
		 *
		 * @param {Array} colors - An array of colors.
		 * @return {Object}
		 */
		removeDuplicateColors: function( colors ) {
			var uniques = {},
				values  = [],
				i;
			for ( i = 0; i < colors.length; i++ ) {

				// if ( ! uniques[ colors[ i ].hex ] ) {
				// 	values.push( colors[i]);
				// }
				uniques[ colors[ i ].hex ] = colors[ i ];
			}
			return Object.keys( uniques ).map( function( v ) {
				return uniques[ v ];
			});
		}
	};
};
