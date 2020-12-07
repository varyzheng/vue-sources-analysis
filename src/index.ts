import Vue from './vue/Vue';

window.Vue = Vue;

declare global {
  interface Window {
    Vue: any,
  }
}
