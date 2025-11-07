/* Utility masks and validators */
function onlyDigits(v){ return v.replace(/\D+/g,''); }
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

function setYear(){ const y=document.getElementById('year'); if(y) y.textContent = new Date().getFullYear(); }
function initCookieBar(){
  const key = 'cliente_campeao_cookie_ok';
  const bar = document.getElementById('cookieBar');
  const btn = document.getElementById('cookieOk');
  if(bar && btn && !localStorage.getItem(key)){ bar.style.display='block'; }
  if(btn){ btn.addEventListener('click', ()=>{ localStorage.setItem(key,'1'); bar.style.display='none'; }); }
}

function initTypeSwitch(){
  const tabPF = document.getElementById('tabPF');
  const tabPJ = document.getElementById('tabPJ');
  const formPF = document.getElementById('formPF');
  const formPJ = document.getElementById('formPJ');
  function activatePF(){ tabPF.classList.add('active'); tabPF.setAttribute('aria-selected','true'); tabPJ.classList.remove('active'); tabPJ.setAttribute('aria-selected','false'); formPF.classList.remove('d-none'); formPJ.classList.add('d-none'); }
  function activatePJ(){ tabPJ.classList.add('active'); tabPJ.setAttribute('aria-selected','true'); tabPF.classList.remove('active'); tabPF.setAttribute('aria-selected','false'); formPJ.classList.remove('d-none'); formPF.classList.add('d-none'); }
  if(tabPF) tabPF.addEventListener('click', activatePF);
  if(tabPJ) tabPJ.addEventListener('click', activatePJ);
}

function bindMasks(){
  const pfCPF = document.getElementById('pfCPF');
  const pfNascimento = document.getElementById('pfNascimento');
  const pfCel = document.getElementById('pfCelular');
  const pfCEP = document.getElementById('pfCEP');
  const pfLog = document.getElementById('pfLogradouro');
  const pfBairro = document.getElementById('pfBairro');
  const pfCidade = document.getElementById('pfCidade');
  const pfUF = document.getElementById('pfUF');

  if(pfCPF) pfCPF.addEventListener('input', e=> e.target.value = maskCPF(e.target.value));
  
  if(pfCPF){
    const validatePfCpfLive = () => {
      const ok = validateCPF(pfCPF.value);
      setFieldValidity(pfCPF, ok, "CPF inválido.");
    };
    pfCPF.addEventListener('input', validatePfCpfLive);
    pfCPF.addEventListener('blur', validatePfCpfLive);
  }
if(pfNascimento) pfNascimento.addEventListener('input', e=> e.target.value = maskDate(e.target.value));
  if(pfCel) pfCel.addEventListener('input', e=> e.target.value = maskPhone(e.target.value));
  if(pfCEP){
    pfCEP.addEventListener('input', e=> e.target.value = maskCEP(e.target.value));
    pfCEP.addEventListener('blur', async e=>{
      const data = await fetchCEP(e.target.value);
      if(data){ pfLog.value = data.logradouro; pfBairro.value = data.bairro; pfCidade.value = data.cidade; pfUF.value = data.uf; }
    });
  }

  const pjCNPJ = document.getElementById('pjCNPJ');
  const pjCel = document.getElementById('pjCelular');
  const pjCEP = document.getElementById('pjCEP');
  const pjLog = document.getElementById('pjLogradouro');
  const pjBairro = document.getElementById('pjBairro');
  const pjCidade = document.getElementById('pjCidade');
  const pjUF = document.getElementById('pjUF');

  if(pjCNPJ) pjCNPJ.addEventListener('input', e=> e.target.value = maskCNPJ(e.target.value));
  
  if(pjCNPJ){
    const validatePjCnpjLive = () => {
      const ok = validateCNPJ(pjCNPJ.value);
      setFieldValidity(pjCNPJ, ok, "CNPJ inválido.");
    };
    pjCNPJ.addEventListener('input', validatePjCnpjLive);
    pjCNPJ.addEventListener('blur', validatePjCnpjLive);
  }
if(pjCel) pjCel.addEventListener('input', e=> e.target.value = maskPhone(e.target.value));
  if(pjCEP){
    pjCEP.addEventListener('input', e=> e.target.value = maskCEP(e.target.value));
    pjCEP.addEventListener('blur', async e=>{
      const data = await fetchCEP(e.target.value);
      if(data){ pjLog.value = data.logradouro; pjBairro.value = data.bairro; pjCidade.value = data.cidade; pjUF.value = data.uf; }
    });
  }

  const buscaCEP = document.getElementById('buscaCEP');
  if(buscaCEP){ buscaCEP.addEventListener('input', e=> e.target.value = maskCEP(e.target.value)); }
}

function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim()); }
function isPhone(v){ return onlyDigits(v).length>=10; }

function initSubmits(){
  const pf = document.getElementById('formPF');
  const pj = document.getElementById('formPJ');

  if(pf){ pf.addEventListener('submit', e=>{ e.preventDefault();
    const cpfField = document.getElementById('pfCPF');
    const cpfOk = validateCPF(cpfField.value);
    setFieldValidity(cpfField, cpfOk, "CPF inválido.");
    const ok = pf.checkValidity() && cpfOk &&
      (document.getElementById('pfConfirmEmail').checked || document.getElementById('pfConfirmSMS').checked) &&
      (!document.getElementById('pfEmail').value || isEmail(document.getElementById('pfEmail').value)) &&
      (!document.getElementById('pfCelular').value || isPhone(document.getElementById('pfCelular').value));
    if(!ok){
      pf.classList.add('was-validated');
      const firstInvalid = pf.querySelector('.is-invalid, :invalid');
      if(firstInvalid){ firstInvalid.focus(); }
      return;
    }
    showConfirmationModal((document.querySelector('input[name="pfConfirm"]:checked')||document.querySelector('input[name="pjConfirm"]:checked')||{value:'email'}).value);
  });}

  if(pj){ pj.addEventListener('submit', e=>{ e.preventDefault();
    const cnpjField = document.getElementById('pjCNPJ');
    const cnpjOk = validateCNPJ(cnpjField.value);
    setFieldValidity(cnpjField, cnpjOk, "CNPJ inválido.");
    const ok = pj.checkValidity() && cnpjOk &&
      (document.getElementById('pjConfirmEmail').checked || document.getElementById('pjConfirmSMS').checked) &&
      isEmail(document.getElementById('pjEmail').value) &&
      isPhone(document.getElementById('pjCelular').value);
    if(!ok){
      pj.classList.add('was-validated');
      const firstInvalid = pj.querySelector('.is-invalid, :invalid');
      if(firstInvalid){ firstInvalid.focus(); }
      return;
    }
    showConfirmationModal((document.querySelector('input[name="pfConfirm"]:checked')||document.querySelector('input[name="pjConfirm"]:checked')||{value:'email'}).value);
  });}
}

function showConfirmationModal(channel){
  var txt = (channel === 'sms') ? 'SMS' : 'e-mail';
  var el = document.getElementById('canalEscolhido');
  if(el){ el.textContent = txt; }
  if (typeof $ !== 'undefined' && $('#modalConfirmacao').modal){
    $('#modalConfirmacao').modal('show');
  } else {
    alert('Cadastro concluído. Você receberá um ' + txt + ' para concluir seu cadastro.');
  }
}

function openStoresModal(){
  if (typeof $ !== 'undefined' && $('#modalLojas').modal){
    $('#modalLojas').modal('show');
  } else {
    alert('Cadastro concluído! Agora escolha sua loja mais próxima.');
  }
}

function initModalActions(){
  const btnEscolher = document.getElementById('btnEscolherLoja');
  if(btnEscolher){
    btnEscolher.addEventListener('click', ()=>{
      const loja = document.getElementById('listaLojas').value || 'nao_selecionada';
      console.log('store_chosen', loja);
      if (typeof $ !== 'undefined' && $('#modalLojas').modal){ $('#modalLojas').modal('hide'); }
      alert('Obrigado! Loja selecionada: ' + loja);
    });
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  setYear();
  initCookieBar();
  initTypeSwitch();
  bindMasks();
  initSubmits();
  initModalActions();
  initConfirmacaoOk();
  initLoginModal();
});


function initConfirmacaoOk(){
  var ok = document.getElementById('btnOkConfirmacao');
  if(ok){
    ok.addEventListener('click', function(){
      try{
        if (typeof $ !== 'undefined' && $('#modalConfirmacao').modal){ $('#modalConfirmacao').modal('hide'); }
      }catch(e){}
      window.scrollTo({top:0, behavior:'smooth'});
    });
  }
}


/* ===== Login Modal (CPF/CNPJ + canal + CTA) ===== */
function initLoginModal(){
  var tabCPF = document.getElementById('loginCpfTab');
  var tabCNPJ = document.getElementById('loginCnpjTab');
  var grupoCPF = document.getElementById('grupoCPF');
  var grupoCNPJ = document.getElementById('grupoCNPJ');
  var inputCPF = document.getElementById('loginCPF');
  var inputCNPJ = document.getElementById('loginCNPJ');
  var stepForm = document.getElementById('loginStepForm');
  var stepSuccess = document.getElementById('loginStepSuccess');
  var btnOk = document.getElementById('btnOkLogin');
  var channelText = document.getElementById('loginChannelText');
  var emailRadio = document.getElementById('loginCanalEmail');
  var smsRadio = document.getElementById('loginCanalSMS');
  var btnProceed = document.getElementById('btnLoginProceed');

  function safeSetValidity(el, ok, msg){ try{ if(!el) return; el.setCustomValidity(ok?'':(msg||'Campo inválido')); el.classList.toggle('is-invalid', !ok); el.classList.toggle('is-valid', ok); }catch(e){} }

  // toggles
  if(tabCPF){
    tabCPF.addEventListener('click', function(){
      tabCPF.classList.add('active'); tabCNPJ.classList.remove('active');
      grupoCPF.classList.remove('d-none'); grupoCNPJ.classList.add('d-none');
      if(inputCPF) inputCPF.setAttribute('required','required'); if(inputCNPJ) inputCNPJ.removeAttribute('required');
      safeSetValidity(inputCNPJ, true, '');
    });
  }
  if(tabCNPJ){
    tabCNPJ.addEventListener('click', function(){
      tabCNPJ.classList.add('active'); tabCPF.classList.remove('active');
      grupoCNPJ.classList.remove('d-none'); grupoCPF.classList.add('d-none');
      if(inputCNPJ) inputCNPJ.setAttribute('required','required'); if(inputCPF) inputCPF.removeAttribute('required');
      safeSetValidity(inputCPF, true, '');
    });
  }

  // masks + live validation
  if(inputCPF){
    inputCPF.addEventListener('input', function(e){ if(typeof maskCPF==='function') e.target.value = maskCPF(e.target.value); });
    var liveCPF = function(){ if(typeof validateCPF==='function') safeSetValidity(inputCPF, validateCPF(inputCPF.value), 'CPF inválido.'); };
    inputCPF.addEventListener('input', liveCPF); inputCPF.addEventListener('blur', liveCPF);
  }
  if(inputCNPJ){
    inputCNPJ.addEventListener('input', function(e){ if(typeof maskCNPJ==='function') e.target.value = maskCNPJ(e.target.value); });
    var liveCNPJ = function(){ if(typeof validateCNPJ==='function') safeSetValidity(inputCNPJ, validateCNPJ(inputCNPJ.value), 'CNPJ inválido.'); };
    inputCNPJ.addEventListener('input', liveCNPJ); inputCNPJ.addEventListener('blur', liveCNPJ);
  }

  // Reveal CTA when channel is selected
  function revealCTA(){ if(btnProceed){ btnProceed.classList.remove('d-none'); btnProceed.focus(); } }
  if(emailRadio) emailRadio.addEventListener('change', revealCTA);
  if(smsRadio) smsRadio.addEventListener('change', revealCTA);

  // Clicking CTA validates and proceeds to success
  if(btnProceed){
    btnProceed.addEventListener('click', function(){
      var usingCPF = !grupoCPF.classList.contains('d-none');
      var channel = (document.querySelector('input[name="loginCanal"]:checked')||{}).value;
      var okCPF = usingCPF ? (typeof validateCPF==='function' ? validateCPF(inputCPF.value) : !!inputCPF.value) : true;
      var okCNPJ = !usingCPF ? (typeof validateCNPJ==='function' ? validateCNPJ(inputCNPJ.value) : !!inputCNPJ.value) : true;
      safeSetValidity(inputCPF, usingCPF ? okCPF : true, 'CPF inválido.');
      safeSetValidity(inputCNPJ, usingCPF ? true : okCNPJ, 'CNPJ inválido.');

      var form = document.getElementById('formLogin');
      var ok = okCPF && okCNPJ && form && form.checkValidity() && (channel==='email' || channel==='sms');
      if(!ok){
        if(form){ form.classList.add('was-validated'); var firstInvalid = form.querySelector('.is-invalid, :invalid'); if(firstInvalid) firstInvalid.focus(); }
        return;
      }
      if(channelText){ channelText.textContent = (channel==='sms' ? 'SMS' : 'e-mail'); }
      if(stepForm) stepForm.classList.add('d-none');
      if(stepSuccess) stepSuccess.classList.remove('d-none');
      if(btnOk) btnOk.classList.remove('d-none');
    });
  }

  // Reset on modal close
  if(typeof $ !== 'undefined' && $('#modalLogin').on){
    $('#modalLogin').on('hidden.bs.modal', function(){
      var form = document.getElementById('formLogin');
      if(form){ form.reset(); form.classList.remove('was-validated'); }
      safeSetValidity(inputCPF, true, ''); safeSetValidity(inputCNPJ, true, '');
      if(btnProceed){ btnProceed.classList.add('d-none'); }
      if(stepSuccess) stepSuccess.classList.add('d-none');
      if(btnOk) btnOk.classList.add('d-none');
      if(stepForm) stepForm.classList.remove('d-none');
      if(tabCPF) tabCPF.click();
      window.scrollTo({top:0, behavior:'smooth'});
    });
  }
}
