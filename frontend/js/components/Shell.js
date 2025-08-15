import { Sidebar } from "./Sidebar.js";
import { Topbar } from "./Topbar.js";

export const Shell = {
  render(contentHtml) {
    return /*html*/`
      <div class="h-dvh w-dvw grid md:grid-cols-[16rem_1fr] gap-3">
        ${Sidebar()}
        <div class="min-h-0 grid grid-rows-[auto_1fr]">
          ${Topbar()}
          <main id="view" class="min-h-0 h-full overflow-auto glass rounded-none p-4 md:p-5">
            ${contentHtml ?? ""}
          </main>
        </div>
      </div>
    `;
  },
  mount(root) {
    const btn = root.querySelector("#btnMenu");
    if (btn) btn.addEventListener("click", () => alert("TODO: menú móvil 😄"));
  }
};
