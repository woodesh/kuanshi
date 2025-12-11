import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        'camera-controls'?: boolean;
        'tone-mapping'?: string;
        'shadow-intensity'?: string | number;
        'shadow-softness'?: string | number;
        'min-camera-orbit'?: string;
        'max-camera-orbit'?: string;
        'disable-pan'?: boolean;
        'disable-tap'?: boolean;
        'disable-zoom'?: boolean;
        'interaction-prompt'?: string;
        'auto-rotate'?: boolean;
        [key: string]: any;
      };
    }
  }
}
