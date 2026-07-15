export class DialogService {
  open(title, body){
    const modal = document.querySelector("#core-modal");
    document.querySelector("#modal-title").textContent = title;
    document.querySelector("#modal-body").innerHTML = body;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
  }
  close(){
    const modal = document.querySelector("#core-modal");
    modal?.classList.remove("open");
    modal?.setAttribute("aria-hidden","true");
  }
}
