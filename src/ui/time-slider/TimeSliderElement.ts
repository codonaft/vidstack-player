import throttle from 'just-throttle';
import { PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';

import { consumeContext, watchContext } from '../../base/context';
import { eventListener, isPointerEvent } from '../../base/events';
import { mediaContext, MediaRemoteControl } from '../../media';
import { setAttribute } from '../../utils/dom';
import { clampNumber, round } from '../../utils/number';
import { formatSpokenTime } from '../../utils/time';
import {
  SliderDragEndEvent,
  SliderDragStartEvent,
  SliderElement,
  SliderValueChangeEvent
} from '../slider';

export const TIME_SLIDER_ELEMENT_TAG_NAME = 'vds-time-slider';

/**
 * A slider that lets the user control the current media playback time.
 *
 * 💡 The following attributes are updated for your styling needs:
 *
 * - `media-can-play`: Applied when media can begin playback.
 *
 * @tagname vds-time-slider
 * @example
 * ```html
 * <vds-time-slider label="Media time slider"></vds-time-slider>
 * ```
 * @example
 * ```css
 * vds-time-slider {
 *   --vds-slider-track-height: 2.5px;
 *   --vds-slider-thumb-width: 16px;
 *   --vds-slider-thumb-height: 16px;
 *   --vds-slider-active-color: #ff2a5d;
 * }
 * ```
 */
export class TimeSliderElement extends SliderElement {
  // -------------------------------------------------------------------------------------------
  // Properties
  // -------------------------------------------------------------------------------------------

  override label = 'Media time slider';
  override shiftKeyMultiplier = 2;

  /**
   * Represents the current % of media playback.
   *
   * @internal
   */
  @property({ attribute: false, state: true })
  override value = -1;

  // These properties are overriden in final render by methods below.
  /** @internal */
  @property({ attribute: false })
  override min = 0;
  /** @internal */
  @property({ attribute: false })
  override max = 100;
  /** @internal */
  @property({ attribute: false })
  override valueMin = '0';
  /** @internal */
  @property({ attribute: false })
  override valueNow = '0';
  /** @internal */
  @property({ attribute: false })
  override valueMax = '0';

  protected _step = 0.25;

  /**
   *  A number that specifies the granularity that the slider value must adhere to in seconds.
   * For example, a step with the value `1` indicates a granularity of 1 second increments.
   *
   * @default 0.25
   */
  @property({ type: Number })
  // @ts-ignore - Defined as accessor here but property in parent class.
  get step() {
    return this._mediaDuration > 0
      ? round((this._step / this._mediaDuration) * 100, 2)
      : this._step;
  }

  override set step(newStep: number) {
    this._step = newStep;
  }

  protected _keyboardStep = 5;

  /**
   * ♿ **ARIA:** A number that specifies the number of seconds to step when interacting
   * with the slider via keyboard.
   *
   * @default 5
   */
  @property({ attribute: 'keyboard-step', type: Number })
  // @ts-ignore - Defined as accessor here but property in parent class.
  get keyboardStep() {
    return this._mediaDuration > 0
      ? round((this._keyboardStep / this._mediaDuration) * 100, 2)
      : this._keyboardStep;
  }

  override set keyboardStep(newStep: number) {
    this._keyboardStep = newStep;
  }

  /**
   * ♿ **ARIA:** Human-readable text alternative for the current slider value. If you pass
   * in a string containing `{currentTime}` or `{duration}` templates they'll be replaced with
   * the spoken form such as `1 hour 30 minutes`.
   */
  override valueText = '{currentTime} out of {duration}';

  /**
   * Whether the scrubber should request playback to pause while the user is dragging the
   * thumb. If the media was playing before the dragging starts, the state will be restored by
   * dispatching a user play request once the dragging ends.
   */
  @property({ attribute: 'pause-while-dragging', type: Boolean })
  pauseWhileDragging = false;

  /**
   * The amount of milliseconds to throttle media seeking request events being dispatched.
   */
  @property({ attribute: 'seeking-request-throttle', type: Number })
  seekingRequestThrottle = 100;

  @state()
  @consumeContext(mediaContext.currentTime)
  protected _mediaCurrentTime = 0;

  @state()
  @consumeContext(mediaContext.duration, { transform: (d) => (d >= 0 ? d : 0) })
  protected _mediaDuration = 0;

  @state()
  @consumeContext(mediaContext.paused)
  protected _mediaPaused = mediaContext.paused.initialValue;

  /**
   * The current media time.
   */
  get currentTime() {
    return this._mediaDuration * (this.value / 100);
  }

  // -------------------------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------------------------

  protected override update(changedProperties: PropertyValues) {
    if (changedProperties.has('disabled') && this.disabled) {
      this._dispatchSeekingRequest.cancel();
    }

    super.update(changedProperties);
  }

  override disconnectedCallback() {
    this._dispatchSeekingRequest.cancel();
    super.disconnectedCallback();
  }

  // -------------------------------------------------------------------------------------------
  // Methods
  // -------------------------------------------------------------------------------------------

  protected override _getValueNow(): string {
    const valueNow = this._mediaDuration * (this.value / 100);
    return String(Math.round(valueNow));
  }

  protected override _getValueMax(): string {
    return String(Math.round(this._mediaDuration));
  }

  protected override _getValueText(): string {
    const currentTime = this._mediaDuration * (this.value / 100);

    return this.valueText
      .replace('{currentTime}', formatSpokenTime(currentTime))
      .replace('{duration}', formatSpokenTime(this._mediaDuration));
  }

  @eventListener('vds-slider-drag-start')
  protected _handleSliderDragStart(event: SliderDragStartEvent) {
    this._togglePlaybackWhileDragging(event);
  }

  protected readonly _mediaRemote = new MediaRemoteControl(this);

  @eventListener('vds-slider-value-change')
  protected _handleSliderValueChange(event: SliderValueChangeEvent) {
    this.value = event.detail;

    if (this.isDragging) {
      this._dispatchSeekingRequest(event);
    }

    if (!isPointerEvent(event.originalEvent)) {
      this._dispatchSeekingRequest.cancel();
      this._mediaRemote.seek(this.currentTime, event);
    }
  }

  @eventListener('vds-slider-drag-end')
  protected _handleSliderDragEnd(event: SliderDragEndEvent) {
    this._dispatchSeekingRequest.cancel();
    this._mediaRemote.seek(this.currentTime, event);
    this._togglePlaybackWhileDragging(event);
  }

  protected readonly _dispatchSeekingRequest = throttle((event: Event) => {
    this._mediaRemote.seeking(this.currentTime, event);
  }, this.seekingRequestThrottle);

  @watchContext(mediaContext.currentTime)
  @watchContext(mediaContext.duration)
  protected _updateValueToCurrentTime() {
    if (this.isDragging) return;

    const percentage =
      this._mediaDuration > 0
        ? (this._mediaCurrentTime / this._mediaDuration) * 100
        : 0;

    this.value = clampNumber(0, round(percentage, 5), 100);
  }

  @watchContext(mediaContext.canPlay)
  protected _handleCanPlayContextUpdate(canPlay: boolean) {
    setAttribute(this, 'media-can-play', canPlay);
  }

  protected _wasPlayingBeforeDragStart = false;

  protected _togglePlaybackWhileDragging(event: Event) {
    if (!this.pauseWhileDragging) return;

    if (this.isDragging && !this._mediaPaused) {
      this._wasPlayingBeforeDragStart = true;
      this._mediaRemote.pause(event);
    } else if (
      this._wasPlayingBeforeDragStart &&
      !this.isDragging &&
      this._mediaPaused
    ) {
      this._wasPlayingBeforeDragStart = false;
      this._mediaRemote.play(event);
    }
  }
}
