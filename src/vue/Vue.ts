import Watcher from './Watcher';

interface VueOptions {
  el: string|Node,
  data?: {
    [key:string]: any,
  },
}

const getDirect = (nodeName: string): string => nodeName.slice(2);
export default class Vue {
  $el: Node

  $data: {
    [key:string]: any,
  }

  $mapping: {
    [key:string]: Watcher[],
  }

  constructor(options: VueOptions) {
    const {
      el, data,
    } = options;
    let target;
    if (typeof el === 'string') {
      target = document.querySelector(el);
    }
    if (el instanceof Node) {
      target = el;
    }
    if (!target) {
      throw new Error('请传入要挂载的DOM元素或者其选择器');
    }
    this.$el = target;
    this.$data = data || {};
    this.$mapping = {};
    this._render(this.$el);
  }

  _render(ele: Node): void {
    const children = Array.from(ele.childNodes);
    if (children && children.length) {
      children.forEach((child) => {
        this._render(child);
      });
    }
    this._renderNode(ele);
  }

  _renderNode(ele: Node): void {
    // 文本节点
    if (ele.nodeType === 3) {
      this._renderTextNode(ele);
    }
    // 元素节点
    if (ele.nodeType === 1) {
      this._renderElementNode(ele as Element);
    }
  }

  /**
   * 渲染文本节点
   * @param ele 文本节点
   */
  _renderTextNode(ele: Node): void {
    let { textContent } = ele;
    if (textContent) {
      // 匹配文本节点中的{{ key }}
      const regExp = /\{\{\s*([\w\W]*)\s*\}\}/;
      const result = textContent.match(regExp);
      if (result) {
        // 将{{ key }}替换为相应的值
        const key = result[1].trim();
        if (key) {
          const originTextContent = textContent || '';
          this._addDependency(key, new Watcher(() => {
            ele.textContent = originTextContent.replace(result[0], this.$data[key]);
          }));
          textContent = originTextContent.replace(result[0], this.$data[key]);
        }
      }
      ele.textContent = textContent;
    }
  }

  /**
   * 渲染元素节点
   * @param ele 元素节点
   */
  _renderElementNode(ele: Element): void {
    const { attributes } = ele;
    if (attributes && attributes.length) {
      const attrArray = Array.from(attributes);
      // 遍历属性，查找以v-开头的属性
      attrArray.forEach((attr) => {
        if (attr.nodeName.startsWith('v-')) {
          const direct = getDirect(attr.nodeName);
          const directValue = attr.nodeValue;
          if (directValue) {
            // 处理相应的vue指令
            this._processDirect(direct, directValue, ele);
          }
        }
      });
    }
  }

  /**
   * 处理vue指令
   * @param name 指令名 v-model="message" 中的model
   * @param key 指令的值 v-model="message" 中的message
   * @param ele 元素节点
   */
  _processDirect(name: string, key: string, ele: Element): void {
    // 获得指令相对应的值
    const value = this.$data[key.trim()];
    switch (name) {
      // v-text
      case 'text':
        ele.textContent = value;
        this._addDependency(key, new Watcher(() => {
          ele.textContent = this.$data[key];
        }));
        break;
      // v-model
      case 'model':
        if (ele instanceof HTMLInputElement) {
          ele.value = value;
          ele.addEventListener('change', () => {
            this.$data[key] = ele.value;
            this._notify(key);
          });
          this._addDependency(key, new Watcher(() => {
            ele.value = this.$data[key];
          }));
        }
        break;
      default:
        break;
    }
  }

  _addDependency(key: string, watcher: Watcher): void {
    const mappingArray = this.$mapping[key];
    if (mappingArray && mappingArray.length) {
      mappingArray.push(watcher);
    } else {
      this.$mapping[key] = [watcher];
    }
  }

  _notify(key: string): void {
    const dependencies = this.$mapping[key];
    dependencies.forEach((watcher) => {
      watcher.task();
    });
  }
}
