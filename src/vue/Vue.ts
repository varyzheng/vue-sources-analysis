interface VueOptions {
  el: string|Element,
  data?: {
    [key:string]: any,
  },
}

export default class Vue {
  $el: Element

  $data?: {
    [key:string]: any,
  }

  constructor(options: VueOptions) {
    const {
      el, data,
    } = options;
    let target;
    if (typeof el === 'string') {
      target = document.querySelector(el);
    }
    if (el instanceof Element) {
      target = el;
    }
    if (!target) {
      throw new Error('请传入要挂载的DOM元素或者其选择器');
    }
    this.$el = target;
    this.$data = data;
  }
}
