// // import { Injectable, signal } from '@angular/core';

// // export interface DfoChatConfig {
// //   scriptUrl: string;
// //   channelId: string;
// //   brandId: string;
// // }

// // declare global {
// //   interface Window {
// //     niceDFOConfig?: Record<string, unknown>;
// //   }
// // }

// // /**
// //  * DfoChatService
// //  * ──────────────
// //  * Manages the lifecycle of the NICE DFO Live Chat widget script.
// //  * The script is injected into the document once and removed on destroy.
// //  * Uses Singleton pattern — provided in root, one instance for the app.
// //  */
// // @Injectable({ providedIn: 'root' })
// // export class DfoChatService {
// //   private scriptId = 'nice-dfo-chat-script';
// //   private loaded = signal(false);
// //   private visible = signal(false);

// //   readonly isLoaded = this.loaded.asReadonly();
// //   readonly isVisible = this.visible.asReadonly();

// //   /**
// //    * Injects the NICE DFO widget script into the document <head>.
// //    * Safe to call multiple times — only injects once.
// //    */
// //   load(config: DfoChatConfig): void {
// //     if (document.getElementById(this.scriptId)) {
// //       this.loaded.set(true);
// //       return;
// //     }

// //     // Set global config BEFORE the script loads
// //     window.niceDFOConfig = {
// //       channelId: config.channelId,
// //       brandId: config.brandId
// //     };

// //     const script = document.createElement('script');
// //     script.id = this.scriptId;
// //     script.type = 'text/javascript';
// //     script.src = config.scriptUrl;
// //     script.async = true;

// //     script.onload = () => {
// //       this.loaded.set(true);
// //       console.info('[DfoChatService] NICE DFO widget loaded successfully.');
// //     };

// //     script.onerror = (err) => {
// //       console.error('[DfoChatService] Failed to load NICE DFO widget:', err);
// //       this.loaded.set(false);
// //     };

// //     document.head.appendChild(script);
// //   }

// //   /** Show the DFO chat widget (calls the NICE SDK open method if available) */
// //   open(): void {
// //     this.visible.set(true);
// //     this.callWidgetApi('open');
// //   }

// //   /** Hide the DFO chat widget */
// //   close(): void {
// //     this.visible.set(false);
// //     this.callWidgetApi('close');
// //   }

// //   toggle(): void {
// //     if (this.visible()) this.close();
// //     else this.open();
// //   }

// //   /** Remove the injected script and reset state (used on logout) */
// //   unload(): void {
// //     const el = document.getElementById(this.scriptId);
// //     if (el) el.remove();
// //     delete window.niceDFOConfig;
// //     this.loaded.set(false);
// //     this.visible.set(false);
// //   }

// //   private callWidgetApi(method: string): void {
// //     // NICE DFO widget exposes a global API — the exact method name
// //     // depends on the tenant SDK version. Adjust if your SDK differs.
// //     const api = (window as any)?.niceDFO ?? (window as any)?.SE_API;
// //     if (api && typeof api[method] === 'function') {
// //       api[method]();
// //     }
// //   }
// // }


// import { Injectable, signal } from '@angular/core';

// export interface DfoChatConfig {
//   /** Loader module URL, e.g. https://web-modules-de-na1.niceincontact.com/loader/1/loader.js */
//   scriptUrl: string;
//   /** Numeric tenant/brand ID from NICE CXone, e.g. '1586' */
//   brandId: string;
//   /** Chat channel ID, e.g. 'chat_1842a9a4-fa58-4469-875b-cb76fcb87e8c' */
//   channelId: string;
// }

// type CxoneFn = ((...args: any[]) => void) & { q?: IArguments[]; u?: string };

// declare global {
//   interface Window {
//     CXoneDfo?: string;
//     cxone?: CxoneFn;
//   }
// }

// /**
//  * DfoChatService
//  * ──────────────
//  * Manages the lifecycle of the NICE CXone DFO Live Chat widget.
//  *
//  * NICE's real embed pattern is a command-queue stub (same style as gtag.js):
//  *   1. window.CXoneDfo = 'cxone'                     — registers the namespace
//  *   2. window.cxone = window.cxone || function(){…}  — queues calls made before
//  *                                                        the real module loads
//  *   3. Inject loader.js as an ES module (type="module"), with a cache-busting
//  *      query param
//  *   4. Immediately (synchronously) call:
//  *        cxone('init', brandId)
//  *        cxone('chat', 'init', brandId, channelId)
//  *      These get queued by the stub and replayed by the real module once it's
//  *      loaded — this is why the calls happen right after appendChild, NOT
//  *      inside script.onload.
//  *
//  * There is no niceDFOConfig global and no DOM "placeholder" element required —
//  * that was an incorrect earlier assumption. The widget UI is mounted by the
//  * module itself once 'chat init' is processed.
//  */
// @Injectable({ providedIn: 'root' })
// export class DfoChatService {
//   private readonly namespace = 'cxone';
//   private scriptEl: HTMLScriptElement | null = null;
//   private loaded = signal(false);
//   private visible = signal(false);

//   readonly isLoaded = this.loaded.asReadonly();
//   readonly isVisible = this.visible.asReadonly();

//   /**
//    * Sets up the cxone() queue stub, injects the loader module, and fires the
//    * init + chat-init calls in the exact order/timing NICE's own snippet uses.
//    * Safe to call multiple times — only injects once.
//    */
//   load(config: DfoChatConfig): void {
//     if (this.scriptEl) {
//       this.loaded.set(true);
//       return;
//     }

//     const ns = this.namespace;
//     const win = window as any;

//     // 1 & 2. Register namespace + queue stub — must exist before we push any
//     // calls or inject the module script.
//     window.CXoneDfo = ns;
//     win[ns] = win[ns] || function () {
//       (win[ns].q = win[ns].q || []).push(arguments);
//     };
//     win[ns].u = config.scriptUrl;

//     // 3. Inject the loader as an ES module with cache-busting param, matching
//     // NICE's own snippet exactly (script.type MUST be 'module').
//     const script = document.createElement('script');
//     script.type = 'module';
//     script.src = `${config.scriptUrl}?${Math.round(Date.now() / 1000 / 3600)}`;

//     script.onload = () => {
//       this.loaded.set(true);
//       console.info('[DfoChatService] NICE DFO widget loaded successfully.');
//     };
//     script.onerror = (err) => {
//       console.error('[DfoChatService] Failed to load NICE DFO widget:', err);
//       this.loaded.set(false);
//     };

//     document.head.appendChild(script);
//     this.scriptEl = script;

//     // 4. Fire init calls synchronously right after appending — same order as
//     // NICE's snippet. The stub above queues these until the real module loads.
//     win[ns]('init', config.brandId);
//     win[ns]('chat', 'init', config.brandId, config.channelId);
//   }

//   /** Show the DFO chat widget */
//   open(): void {
//     this.visible.set(true);
//     this.callWidgetApi('open');
//   }

//   /** Hide the DFO chat widget */
//   close(): void {
//     this.visible.set(false);
//     this.callWidgetApi('close');
//   }

//   toggle(): void {
//     if (this.visible()) this.close();
//     else this.open();
//   }

//   /** Remove the injected script and reset state (used on logout) */
//   unload(): void {
//     if (this.scriptEl) {
//       this.scriptEl.remove();
//       this.scriptEl = null;
//     }
//     delete (window as any).cxone;
//     delete window.CXoneDfo;
//     this.loaded.set(false);
//     this.visible.set(false);
//   }

//   /**
//    * Calls into the loaded cxone() queue function to control the widget UI.
//    * NOTE: 'chat', 'open' / 'chat', 'close' are best-effort based on NICE's
//    * command pattern (namespace, 'chat', action). If the widget doesn't
//    * respond to these, check NICE CXone's DFO API docs for your SDK version
//    * for the exact command name.
//    */
// //   private callWidgetApi(method: string): void {
// //     const win = window as any;
// //     if (win.cxone && typeof win.cxone === 'function') {
// //       win.cxone('chat', method);
// //     }
// //   }
// }



import { Injectable, signal } from '@angular/core';

export interface DfoChatConfig {
  scriptUrl: string;
  channelId: string;
  brandId: string;
}

type CxoneFn = ((...args: any[]) => void) & {
  q?: IArguments[];
  u?: string;
};

declare global {
  interface Window {
    CXoneDfo?: string;
    cxone?: CxoneFn;
  }
}

@Injectable({
  providedIn: 'root'
})
export class DfoChatService {

  private scriptId = 'cxone-dfo-script';

  private loaded = signal(false);
  private visible = signal(false);

  readonly isLoaded = this.loaded.asReadonly();
  readonly isVisible = this.visible.asReadonly();

  load(config: DfoChatConfig): void {

    // Prevent duplicate loading
    if (document.getElementById(this.scriptId)) {
      this.loaded.set(true);
      return;
    }

    const win = window as any;

    // Create NICE queue stub
    window.CXoneDfo = 'cxone';

    win.cxone = win.cxone || function () {
      (win.cxone.q = win.cxone.q || []).push(arguments);
    };

    win.cxone.u = config.scriptUrl;

    // Create loader script exactly like NICE snippet
    const script = document.createElement('script');

    script.id = this.scriptId;
    script.type = 'module';

    script.src =
      `${config.scriptUrl}?${Math.round(Date.now()/1000/3600)}`;

    script.onload = () => {
      this.loaded.set(true);

      console.log(
        '[DfoChatService] NICE widget loaded'
      );

      // Open automatically after load
      setTimeout(() => {
        this.open();
      },1500);
    };

    script.onerror=(err)=>{
      console.error(
        '[DfoChatService] Failed loading NICE widget',
        err
      );

      this.loaded.set(false);
    };

    document.head.appendChild(script);

    // EXACT initialization from NICE
    win.cxone(
      'init',
      config.brandId
    );

    win.cxone(
      'chat',
      'init',
      Number(config.brandId),
      config.channelId
    );
  }

  open(): void {
    this.visible.set(true);
    this.callWidgetApi('open');
  }

  close(): void {
    this.visible.set(false);
    this.callWidgetApi('close');
  }

  toggle(): void {
    this.visible()
      ? this.close()
      : this.open();
  }

  unload(): void {

    const script =
      document.getElementById(this.scriptId);

    if(script){
      script.remove();
    }

    delete (window as any).cxone;
    delete window.CXoneDfo;

    this.loaded.set(false);
    this.visible.set(false);
  }

  private callWidgetApi(
    method:string
  ):void{

    const win:any=window;

    if(!win.cxone){
      return;
    }

    if(method==='open'){

      win.cxone(
        'chat',
        'show'
      );
    }

    if(method==='close'){

      win.cxone(
        'chat',
        'hide'
      );
    }
  }
}