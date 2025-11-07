/* account.js — atualização de cadastro (PF/PJ)
   Reaproveita máscaras/validações do projeto e mantém CPF/CNPJ e Nascimento como somente leitura.
   Sem confirmação por e-mail/SMS; apenas salva.
*/

/* === Utilidades === */
function onlyDigits(v){ return String(v||'').replace(/\D+/g,''); }
function maskCPF(v){ v=onlyDigits(v).slice(0,11);
  return v.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2'); }
function maskCNPJ(v){ v=onlyDigits(v).slice(0,14);
  return v.replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2'); }
function maskCEP(v){ v=onlyDigits(v).slice(0,8);
  return v.replace(/^(\d{2})(\d)/,'$1.$2').replace(/\.(\d{3})(\d)/,'.$1-$2'); }
function maskPhone(v){ v=onlyDigits(v).slice(0,11);
  if(v.length<=10){ return v.replace(/^(\d{2})(\d)/,'($1) $2').replace(/(\d{4})(\d)/,'$1-$2'); }
  return v.replace(/^(\d{2})(\d)/,'($1) $2 ').replace(/(\d{5})(\d)/,'$1-$2'); }
function maskDate(v){ v=onlyDigits(v).slice(0,8); return v.replace(/(\d{2})(\d)/,'$1/$2').replace(/(\d{2})(\d)/,'$1/$2'); }

function validateCPF(cpf){
  cpf = onlyDigits(cpf);
  if(!cpf || cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0; for(let i=0;i<9;i++) sum += parseInt(cpf[i])*(10-i);
  let d1 = (sum*10)%11; if(d1===10) d1=0; if(d1!=cpf[9]) return false;
  sum=0; for(let i=0;i<10;i++) sum += parseInt(cpf[i])*(11-i);
  let d2 = (sum*10)%11; if(d2===10) d2=0; return d2==cpf[10];
}
function validateCNPJ(cnpj){
  cnpj = onlyDigits(cnpj);
  if(!cnpj || cnpj.length!==14 || /^(\d)\1+$/.test(cnpj)) return false;
  const calc = (base) => {
    let numbers = base.substring(0, base.length);
    let sum = 0, pos = numbers.length - 7;
    for(let i=numbers.length; i>=1; i--){
      sum += numbers[numbers.length-i]*pos--;
      if(pos < 2) pos = 9;
    }
    return (sum % 11) < 2 ? 0 : 11 - (sum % 11);
  }
  let d1 = calc(cnpj.substring(0,12)); if(parseInt(cnpj[12])!==d1) return false;
  let d2 = calc(cnpj.substring(0,13)); if(parseInt(cnpj[13])!==d2) return false;
  return true;
}
function setFieldValidity(el, isValid, message){
  if(!el) return;
  try{ el.setCustomValidity(isValid ? "" : (message || "Campo inválido")); }catch(e){}
  el.classList.toggle("is-invalid", !isValid);
  el.classList.toggle("is-valid", isValid);
  el.setAttribute("aria-invalid", String(!isValid));
}
async function fetchCEP(cep){
  cep = onlyDigits(cep);
  if(cep.length!==8) return null;
  try{
    const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await resp.json();
    if(data.erro) return null;
    return { logradouro:data.logradouro||'', bairro:data.bairro||'', cidade:data.localidade||'', uf:data.uf||'' }
  }catch(e){ return null; }
}
function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim()); }
function isPhone(v){ return onlyDigits(v).length>=10; }

/* === Estado (demo localStorage) === */
const STORAGE_KEY = 'cliente_campeao_profile';
function loadProfile(){ try{ const s=localStorage.getItem(STORAGE_KEY); return s?JSON.parse(s):{} }catch(e){ return {} } }
function saveProfile(p){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(p||{})); }catch(e){} }

/* === Helpers de UI === */
function setYear(){ const y=document.getElementById('year'); if(y) y.textContent = new Date().getFullYear(); }

function bindMasksPF(){
  const cel = document.getElementById('pfCelular');
  const cep = document.getElementById('pfCEP');
  const log = document.getElementById('pfLogradouro');
  const bairro = document.getElementById('pfBairro');
  const cidade = document.getElementById('pfCidade');
  const uf = document.getElementById('pfUF');
  const cpf = document.getElementById('pfCPF');
  const nascimento = document.getElementById('pfNascimento');

  if(cpf){ cpf.addEventListener('input', e=> e.target.value = maskCPF(e.target.value)); }
  if(nascimento){ nascimento.addEventListener('input', e=> e.target.value = maskDate(e.target.value)); }
  if(cel) cel.addEventListener('input', e=> e.target.value = maskPhone(e.target.value));
  if(cep){
    cep.addEventListener('input', e=> e.target.value = maskCEP(e.target.value));
    cep.addEventListener('blur', async e=>{
      const data = await fetchCEP(e.target.value);
      if(data){ log.value = data.logradouro; bairro.value = data.bairro; cidade.value = data.cidade; uf.value = data.uf; }
    });
  }
}
function bindMasksPJ(){
  const cel = document.getElementById('pjCelular');
  const cep = document.getElementById('pjCEP');
  const log = document.getElementById('pjLogradouro');
  const bairro = document.getElementById('pjBairro');
  const cidade = document.getElementById('pjCidade');
  const uf = document.getElementById('pjUF');
  const cnpj = document.getElementById('pjCNPJ');

  if(cnpj) cnpj.addEventListener('input', e=> e.target.value = maskCNPJ(e.target.value));
  if(cel) cel.addEventListener('input', e=> e.target.value = maskPhone(e.target.value));
  if(cep){
    cep.addEventListener('input', e=> e.target.value = maskCEP(e.target.value));
    cep.addEventListener('blur', async e=>{
      const data = await fetchCEP(e.target.value);
      if(data){ log.value = data.logradouro; bairro.value = data.bairro; cidade.value = data.cidade; uf.value = data.uf; }
    });
  }
}

/* === Preenchimento (demo) === */
function hydratePF(){
  const p = loadProfile();
  if(p.pf){
    const f = p.pf;
    assign('pfNome', f.nome);
    assign('pfSobrenome', f.sobrenome);
    assign('pfEmail', f.email);
    assign('pfCelular', f.celular);
    assign('pfCPF', maskCPF(f.cpf||''));
    assign('pfNascimento', f.nascimento);
    select('pfGenero', f.genero);
    select('pfArea', f.area);

    assign('pfCEP', maskCEP(f.endereco?.cep||''));
    assign('pfLogradouro', f.endereco?.logradouro);
    assign('pfNumero', f.endereco?.numero);
    assign('pfComplemento', f.endereco?.complemento);
    assign('pfBairro', f.endereco?.bairro);
    assign('pfCidade', f.endereco?.cidade);
    select('pfUF', f.endereco?.uf);

    setChecked('pfOptWhatsapp', !!f.optWhatsapp);
    setChecked('pfOptSMS', !!f.optSMS);
    setChecked('pfOptEmail', !!f.optEmail);
  }
  setReadOnly('pfCPF', true);
  setReadOnly('pfNascimento', true);
}
function hydratePJ(){
  const p = loadProfile();
  if(p.pj){
    const f = p.pj;
    assign('pjRazao', f.razao);
    assign('pjCNPJ', maskCNPJ(f.cnpj||''));
    assign('pjEmail', f.email);
    assign('pjCelular', f.celular);
    select('pjCategoria', f.categoria);

    assign('pjCEP', maskCEP(f.endereco?.cep||''));
    assign('pjLogradouro', f.endereco?.logradouro);
    assign('pjNumero', f.endereco?.numero);
    assign('pjComplemento', f.endereco?.complemento);
    assign('pjBairro', f.endereco?.bairro);
    assign('pjCidade', f.endereco?.cidade);
    select('pjUF', f.endereco?.uf);

    setChecked('pjOptWhatsapp', !!f.optWhatsapp);
    setChecked('pjOptSMS', !!f.optSMS);
    setChecked('pjOptEmail', !!f.optEmail);
  }
  setReadOnly('pjCNPJ', true);
}

/* Helpers de DOM */
function assign(id, value){ const el=document.getElementById(id); if(el && value!=null) el.value = value; }
function select(id, value){ const el=document.getElementById(id); if(el && value!=null) el.value = value; }
function setChecked(id, on){ const el=document.getElementById(id); if(el) el.checked = !!on; }
function setReadOnly(id, on){ const el=document.getElementById(id); if(el){ el.readOnly = !!on; el.setAttribute('aria-readonly', String(!!on)); el.tabIndex = on ? -1 : 0; } }

/* === Validações e submit === */
function initSubmitPF(){
  const form = document.getElementById('formPF');
  if(!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();

    const emailOk = isEmail(document.getElementById('pfEmail').value);
    setFieldValidity(document.getElementById('pfEmail'), emailOk, 'E-mail inválido.');
    const celOk = isPhone(document.getElementById('pfCelular').value);
    setFieldValidity(document.getElementById('pfCelular'), celOk, 'Celular inválido.');
    const cpfOk = validateCPF(document.getElementById('pfCPF').value);
    setFieldValidity(document.getElementById('pfCPF'), cpfOk, 'CPF inválido.');

    if(!(form.checkValidity() && emailOk && celOk && cpfOk)){
      form.classList.add('was-validated');
      const firstInvalid = form.querySelector('.is-invalid, :invalid');
      if(firstInvalid) firstInvalid.focus();
      return;
    }

    const payload = {
      nome: document.getElementById('pfNome').value,
      sobrenome: document.getElementById('pfSobrenome').value,
      email: document.getElementById('pfEmail').value,
      celular: document.getElementById('pfCelular').value,
      cpf: onlyDigits(document.getElementById('pfCPF').value),
      nascimento: document.getElementById('pfNascimento').value,
      genero: document.getElementById('pfGenero').value,
      area: document.getElementById('pfArea').value,
      endereco: {
        cep: onlyDigits(document.getElementById('pfCEP').value),
        logradouro: document.getElementById('pfLogradouro').value,
        numero: document.getElementById('pfNumero').value,
        complemento: document.getElementById('pfComplemento').value,
        bairro: document.getElementById('pfBairro').value,
        cidade: document.getElementById('pfCidade').value,
        uf: document.getElementById('pfUF').value
      },
      optWhatsapp: document.getElementById('pfOptWhatsapp').checked,
      optSMS: document.getElementById('pfOptSMS').checked,
      optEmail: document.getElementById('pfOptEmail').checked
    };
    const profile = loadProfile();
    profile.pf = payload;
    saveProfile(profile);

    alert('Dados atualizados com sucesso (PF).');
  });
}
function initSubmitPJ(){
  const form = document.getElementById('formPJ');
  if(!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();

    const emailOk = isEmail(document.getElementById('pjEmail').value);
    setFieldValidity(document.getElementById('pjEmail'), emailOk, 'E-mail inválido.');
    const celOk = isPhone(document.getElementById('pjCelular').value);
    setFieldValidity(document.getElementById('pjCelular'), celOk, 'Celular inválido.');
    const cnpjOk = validateCNPJ(document.getElementById('pjCNPJ').value);
    setFieldValidity(document.getElementById('pjCNPJ'), cnpjOk, 'CNPJ inválido.');

    if(!(form.checkValidity() && emailOk && celOk && cnpjOk)){
      form.classList.add('was-validated');
      const firstInvalid = form.querySelector('.is-invalid, :invalid');
      if(firstInvalid) firstInvalid.focus();
      return;
    }

    const payload = {
      razao: document.getElementById('pjRazao').value,
      cnpj: onlyDigits(document.getElementById('pjCNPJ').value),
      email: document.getElementById('pjEmail').value,
      celular: document.getElementById('pjCelular').value,
      categoria: document.getElementById('pjCategoria').value,
      endereco: {
        cep: onlyDigits(document.getElementById('pjCEP').value),
        logradouro: document.getElementById('pjLogradouro').value,
        numero: document.getElementById('pjNumero').value,
        complemento: document.getElementById('pjComplemento').value,
        bairro: document.getElementById('pjBairro').value,
        cidade: document.getElementById('pjCidade').value,
        uf: document.getElementById('pjUF').value
      },
      optWhatsapp: document.getElementById('pjOptWhatsapp').checked,
      optSMS: document.getElementById('pjOptSMS').checked,
      optEmail: document.getElementById('pjOptEmail').checked
    };
    const profile = loadProfile();
    profile.pj = payload;
    saveProfile(profile);

    alert('Dados atualizados com sucesso (PJ).');
  });
}

/* === Boot === */
document.addEventListener('DOMContentLoaded', ()=>{
  setYear();

  if(document.getElementById('formPF')){
    bindMasksPF();
    hydratePF();
    initSubmitPF();
  }
  if(document.getElementById('formPJ')){
    bindMasksPJ();
    hydratePJ();
    initSubmitPJ();
  }
});
