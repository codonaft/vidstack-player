import { effect } from 'maverick.js';
import { BOOLEAN, Host, type Attributes } from 'maverick.js/element';

import { useDefaultLayoutContext } from '../../../components/layouts/default/context';
import { SliderValue, type SliderValueProps } from '../../../components/ui/sliders/slider-value';

/**
 * @docs {@link https://www.vidstack.io/docs/wc/player/components/sliders/slider-value}
 * @example
 * ```html
 * <media-time-slider>
 *   <media-slider-preview>
 *     <media-slider-value></media-slider-value>
 *   </media-slider-preview>
 * </media-time-slider>
 * ```
 * @example
 * ```html
 * <media-slider-value type="current"></media-slider-value>
 * ```
 * @example
 * ```html
 * <media-slider-value show-hours pad-hours></media-slider-value>
 * ```
 * @example
 * ```html
 * <media-slider-value decimal-places="2"></media-slider-value>
 * ```
 */
export class MediaSliderValueElement extends Host(HTMLElement, SliderValue) {
  static tagName = 'media-slider-value';

  static override attrs: Attributes<SliderValueProps> = {
    padMinutes: {
      converter: BOOLEAN,
    },
  };

  protected onConnect() {
    effect(() => {
      const { smallWhen } = useDefaultLayoutContext();
      const text = this.getValueText();
      const hotkey = text.endsWith('%') ? '⇅' : '⇄';
      const hint = hotkey && !smallWhen() ? `(${hotkey}) ` : '';
      this.textContent = hint + text;
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'media-slider-value': MediaSliderValueElement;
  }
}
