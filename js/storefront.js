const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const pounds = amount => new Intl.NumberFormat('en-GB', {style: 'currency', currency: 'GBP'}).format(amount);

const catalog = JSON.parse($('#storefrontCatalog').textContent);
const products = catalog.products;
const featured = catalog.featuredProductIds.map(id => products.find(product => product.id === id)).filter(Boolean);
const categoryProducts = [
  ...['house-fly-repellent-oil','lemongrass-citronella-insect-repellent','silverfish-repellent-spray','antiseptic-disinfectant'].map(id=>products.find(p=>p.id===id)),
  ...products.slice(0,5).map(p=>({...p,category:'Garden & Plant Care'}))
].filter(Boolean).map((p,i)=>({...p,id:`category-${i+1}`,sizes:p.sizes||[{label:'Standard (demo)',factor:1}],description:p.description||'Demonstration product for visual design.'}));
const reviews = [
  ['Hannah S. - Sheffield','Been looking for safer alternatives for a while, and this ticks all the boxes. Effective, easy to use, and safe for both kids and pets.'],
  ['Sophie L. - Birmingham','Love that the products are pet-friendly. Great quality and fast delivery.'],
  ['Amelia R. - Leeds','Fantastic customer service and quality products. The parcel arrived well-packaged.'],
  ['James W. - Manchester','Reliable and effective products at good value.'],
  ['Charlotte H. - Birmingham','Impressed by the quality and quick delivery.'],
  ['Oliver T. - London','Professional-grade results without harsh odours.']
];
let currentCategory='All';
let currentHero=0;
let reviewIndex=0;
let toastTimer;
let heroTimer;
const supportsMotion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let heroPlaying = supportsMotion;
const stored = (()=>{try{return JSON.parse(localStorage.getItem('ddteck-preview-cart')||'[]')}catch{return []}})();
let cart=Array.isArray(stored)?stored:[];
function saveCart(){try{localStorage.setItem('ddteck-preview-cart',JSON.stringify(cart))}catch{}}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.remove('opacity-0','translate-y-[30px]');el.classList.add('opacity-100','translate-y-0');clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.classList.add('opacity-0','translate-y-[30px]');el.classList.remove('opacity-100','translate-y-0')},3000)}

function productCard(product){
  const item=document.createElement('article');item.className='product-card group relative min-w-0';item.dataset.category=product.category;
  item.innerHTML=`<a class="product-image relative block h-[240px] w-full overflow-hidden bg-white max-[550px]:h-[200px]" href="/products/${product.slug}" aria-label="View ${product.name}"><img loading="lazy" src="${product.image}" alt="" class="h-full w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-110"></a><div class="product-overactions absolute right-2 top-2 z-10 flex translate-y-[5px] flex-col gap-[7px] opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"><button class="grid h-8 w-8 place-items-center border border-[#eee] bg-white hover:bg-brand-lime" data-open-product="${product.id}" aria-label="Quick view">◉</button><button class="grid h-8 w-8 place-items-center border border-[#eee] bg-white hover:bg-brand-lime" data-add-product="${product.id}" aria-label="Add to cart">+</button></div><a class="product-title mt-3 block min-h-[65px] w-full border-0 bg-transparent pb-[3px] pt-3 text-left font-display text-[14px] font-bold leading-[1.46] text-[#1e1e1e] hover:text-[#358b2a] max-[550px]:min-h-[63px] max-[550px]:text-xs" href="/products/${product.slug}"></a><span class="product-price mt-[9px] block text-xs font-semibold max-[550px]:text-[11px]">From ${pounds(product.price)}</span>`;
  $('.product-title',item).textContent=product.name;
  $('.product-image img',item).alt=product.name;
  return item;
}
function addObserver(elements){if(!supportsMotion){elements.forEach(el=>el.classList.add('opacity-100','translate-y-0'));return}elements.forEach(el=>revealObserver.observe(el))}
const revealObserver=new IntersectionObserver((entries,obs)=>{for(const x of entries){if(x.isIntersecting){x.target.classList.add('opacity-100','translate-y-0');obs.unobserve(x.target)}}},{threshold:.07,rootMargin:'0px 0px 70px 0px'});
function renderBest(){const root=$('#bestGrid');root.replaceChildren();let found=products.filter(p=>currentCategory==='All'||p.category===currentCategory);if(!found.length)found=products;found.forEach(p=>root.appendChild(productCard(p)));addObserver($$('.reveal',root))}
function renderFeatured(){
  const root=$('#featuredTrack');
  root.replaceChildren();
  featured.forEach((product)=>{
    const item=document.createElement('article');
    item.className='group relative aspect-[9/16] w-[71.428%] shrink-0 snap-center overflow-hidden rounded-xl bg-[#f7f7f4] shadow-sm min-[600px]:w-[45.454%] min-[1024px]:w-[calc((100%-60px)/4)]';
    const image=document.createElement('img');
    image.src=product.coverImage||product.image;
    image.alt=product.name;
    image.loading='lazy';
    image.className='absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105';
    const shade=document.createElement('span');
    shade.className='absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent';
    shade.setAttribute('aria-hidden','true');
    const link=document.createElement('a');
    link.href=`/products/${product.slug}`;
    link.className='absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-lg bg-white/95 p-3 text-left shadow-lg transition hover:bg-white';
    link.setAttribute('aria-label',`${product.name}, £${product.price.toFixed(2)}`);
    const thumb=document.createElement('img');
    thumb.src=product.image;
    thumb.alt='';
    thumb.loading='lazy';
    thumb.className='h-14 w-14 shrink-0 rounded-md bg-white object-contain';
    const details=document.createElement('span');
    details.className='min-w-0';
    const title=document.createElement('span');
    title.className='line-clamp-2 block text-xs font-semibold leading-4 text-[#202020]';
    title.textContent=product.name;
    const price=document.createElement('span');
    price.className='mt-1 block text-xs font-semibold text-[#555]';
    price.textContent=pounds(product.price);
    details.append(title,price);
    link.append(thumb,details);
    item.append(image,shade,link);
    root.append(item);
  });
  root.addEventListener('scroll',updateFeaturedProgress,{passive:true});
  updateFeaturedProgress();
}
function updateFeaturedProgress(){
  const track=$('#featuredTrack');
  const progress=$('#featuredProgress');
  const bar=progress.parentElement;
  const maximum=Math.max(0,track.scrollWidth-track.clientWidth);
  const value=maximum?Math.min(100,Math.max(0,track.scrollLeft/maximum*100)):100;
  progress.style.width=`${value}%`;
  bar.setAttribute('aria-valuenow',String(Math.round(value)));
}
let featuredAnimationFrame=0;
function moveFeatured(direction){
  const track=$('#featuredTrack');
  const first=track.firstElementChild;
  if(!first)return;
  const maximum=Math.max(0,track.scrollWidth-track.clientWidth);
  const gap=parseFloat(getComputedStyle(track).columnGap)||22;
  const step=first.getBoundingClientRect().width+gap;
  const next=track.scrollLeft+direction*step;
  const destination=next<0?maximum:next>maximum?0:next;
  cancelAnimationFrame(featuredAnimationFrame);
  const start=track.scrollLeft;
  const started=performance.now();
  track.style.scrollSnapType='none';
  const animate=(now)=>{
    const ratio=Math.min(1,(now-started)/600);
    const eased=1-Math.pow(1-ratio,3);
    track.scrollLeft=start+(destination-start)*eased;
    if(ratio<1)featuredAnimationFrame=requestAnimationFrame(animate);
    else{track.style.scrollSnapType='';updateFeaturedProgress()}
  };
  featuredAnimationFrame=requestAnimationFrame(animate);
}
function renderCategory(){const root=$('#categoryTrack');root.replaceChildren();let records=categoryProducts.filter(p=>p.category===currentCategory);records=[...records,...categoryProducts.filter(p=>!records.some(r=>r.id===p.id))];records.forEach(p=>{const card=productCard(p);card.classList.add('w-[calc((100%-75px)/4)]','shrink-0','snap-start','max-[780px]:w-[42%]','max-[550px]:w-[75%]');root.appendChild(card)});const bar=$('#categoryProgress');bar.style.width='35%';addObserver($$('.reveal',root))}
function setCategory(value){currentCategory=value;$$('#categoryTabs button').forEach(b=>{const selected=b.dataset.tab===value;b.classList.toggle('selected',selected);b.classList.toggle('text-[#272727]',selected);b.classList.toggle('border-[#272727]',selected);b.classList.toggle('text-[#aaa]',!selected);b.classList.toggle('border-transparent',!selected)});renderCategory()}
function renderBenefits(){const badges=[['🌿','100% NATURAL','✔ 100% Natural Ingredients'],['👪','FAMILY & PET SAFE','✔ Family & Pet Safe'],['🐇','CRUELTY-FREE','✔ Cruelty-Free'],['🚚','FAST DELIVERY','✔ Fast UK Delivery']];let html='';for(let j=0;j<2;j++)for(const [icon,label,title] of badges){html+=`<div class="flex min-w-[300px] items-center gap-5 whitespace-nowrap font-display text-base font-bold tracking-[.2px] max-[1050px]:min-w-[270px] max-[550px]:min-w-[235px] max-[550px]:gap-2.5 max-[550px]:text-xs"><span class="flex h-[65px] w-[66px] flex-col items-center justify-center rounded-[13px] bg-[#269e19] font-sans leading-none text-white [transform:rotate(-1deg)] max-[550px]:h-[54px] max-[550px]:w-[58px]"><span class="text-[21px]">${icon}</span><small class="mt-[3px] text-[10px] font-black tracking-[-.7px]">${label}</small></span><span>${title}</span></div>`}$('#benefitTrack').innerHTML=html}
function heroShow(n){const slides=$$('.hero-slide');currentHero=(n+slides.length)%slides.length;slides.forEach((s,i)=>{const active=i===currentHero;s.classList.toggle('active',active);s.classList.toggle('invisible',!active);s.classList.toggle('visible',active);s.classList.toggle('opacity-0',!active);s.classList.toggle('opacity-100',active);s.classList.toggle('scale-[1.025]',!active);s.classList.toggle('scale-100',active)});$$('#heroDots button').forEach((d,i)=>{const active=i===currentHero;d.classList.toggle('bg-white',active);d.classList.toggle('w-[65px]',active);d.classList.toggle('bg-[#e2e2e2]',!active);d.classList.toggle('w-12',!active)})}
function heroNext(){heroShow(currentHero+1)}
function heroPlay(){clearInterval(heroTimer);if(heroPlaying)heroTimer=setInterval(()=>{if(!document.hidden)heroNext()},6500)}
function setHeroPlaying(playing){heroPlaying=Boolean(playing)&&supportsMotion;clearInterval(heroTimer);const button=$('#heroToggle');button.textContent=heroPlaying?'Pause':supportsMotion?'Play':'Paused';button.setAttribute('aria-label',heroPlaying?'Pause slideshow':supportsMotion?'Play slideshow':'Slideshow paused because reduced motion is enabled');button.setAttribute('aria-pressed',String(heroPlaying));button.disabled=!supportsMotion;if(heroPlaying)heroPlay()}
function reviewsRender(){const root=$('#reviewsTrack');root.style.opacity='0';setTimeout(()=>{root.replaceChildren();[reviews[reviewIndex%reviews.length],reviews[(reviewIndex+1)%reviews.length]].forEach(([name,quote])=>{const e=document.createElement('article');e.className='min-w-0';const h=document.createElement('h3');h.className='font-display text-xl font-semibold';h.textContent=name;const stars=document.createElement('div');stars.className='text-base tracking-[5px] text-brand-lime';stars.textContent='★★★★★';const p=document.createElement('p');p.className='mt-5 text-sm leading-[1.7] text-[#ddd]';p.textContent=quote;e.append(h,stars,p);root.append(e)});root.style.opacity='1'},supportsMotion?160:0)}
function findItem(id){return products.find(p=>p.id===id)||categoryProducts.find(p=>p.id===id)||featured.map((p,i)=>({...p,id:`featured-${i}`})).find(p=>p.id===id)}
function backdrop(isOpen,container,scrim){const el=$(container),mask=$(scrim);if(container==='#productModal'){el.classList.toggle('invisible',!isOpen);el.classList.toggle('opacity-0',!isOpen);el.classList.toggle('translate-y-[5%]',!isOpen);el.classList.toggle('visible',isOpen);el.classList.toggle('opacity-100',isOpen);el.classList.toggle('translate-y-0',isOpen)}else{el.classList.toggle('translate-x-[103%]',!isOpen);el.classList.toggle('translate-x-0',isOpen)}el.setAttribute('aria-hidden',isOpen?'false':'true');if(mask)mask.hidden=!isOpen;document.body.style.overflow=$$('#cartDrawer.translate-x-0,#productModal.visible').length?'hidden':''}
function openCart(){renderCart();backdrop(true,'#cartDrawer','#cartScrim')}
function closeCart(){backdrop(false,'#cartDrawer','#cartScrim')}
function closeProduct(){backdrop(false,'#productModal','#productScrim')}
function productPrice(p,variant){return p.price*(p.sizes?.[variant]?.factor||1)}
function openProduct(p){const content=$('#productModalContent');content.replaceChildren();const grid=document.createElement('div');grid.className='grid grid-cols-[45%_55%] gap-7 pr-5 max-[550px]:grid-cols-1 max-[550px]:p-0';const img=document.createElement('img');img.src=p.image;img.alt=p.name;img.className='h-[360px] w-full object-contain max-[550px]:h-[210px]';const info=document.createElement('div');const label=document.createElement('small');label.className='text-xs font-bold text-[#777]';label.textContent=p.category||'COLLECTION';const title=document.createElement('h2');title.className='font-display text-[30px] font-semibold leading-[1.15] max-[550px]:text-2xl';title.textContent=p.name;const price=document.createElement('strong');price.id='modalPrice';price.className='text-lg';price.textContent=pounds(p.price);const description=document.createElement('p');description.className='text-[13px] leading-[1.7] text-[#777]';description.textContent=p.description||'Demo product based on your screenshot design.';const selectLabel=document.createElement('label');selectLabel.className='my-[22px] block text-xs font-bold';selectLabel.textContent='Choose a size';const sel=document.createElement('select');sel.className='w-full border border-[#ddd] p-3';(p.sizes||[{label:'Standard',factor:1}]).forEach((v,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=v.label;sel.append(option)});sel.onchange=()=>price.textContent=pounds(productPrice(p,Number(sel.value)));const add=document.createElement('button');add.className='mt-[19px] w-full border-0 bg-[#202020] px-[23px] py-[15px] font-extrabold text-white';add.textContent='ADD TO CART';add.onclick=()=>{addCart(p.id,Number(sel.value));closeProduct()};info.append(label,title,price,description,selectLabel,sel,add);grid.append(img,info);content.append(grid);backdrop(true,'#productModal','#productScrim')}
function addCart(id,variant=0){const p=findItem(id);if(!p)return;const key=id+':'+variant;const line=cart.find(x=>x.key===key);if(line)line.qty=Math.min(99,line.qty+1);else cart.push({key,id,variant,qty:1});saveCart();updateCartCount();toast('Added to cart')}
function updateCartCount(){const qty=cart.reduce((a,b)=>a+b.qty,0);$('#cartCount').textContent=qty;$('#cartCount').hidden=!qty;$('#cartPanelCount').textContent=`(${qty})`}
function renderCart(){const lines=$('#cartLines');lines.replaceChildren();let total=0;if(!cart.length){lines.innerHTML='<p class="text-sm text-[#555]">Your cart is empty. <a class="text-brand-green underline" href="#best" id="cartShop">Start shopping</a></p>';$('#cartSubtotal').textContent=pounds(0);return}cart.forEach(entry=>{const p=findItem(entry.id);if(!p)return;const sum=productPrice(p,entry.variant)*entry.qty;total+=sum;const div=document.createElement('div');div.className='mb-5 grid grid-cols-[76px_1fr_auto] items-center gap-[14px]';div.innerHTML=`<img class="h-[90px] w-[76px] object-contain" src="${p.image}" alt=""><div><h3 class="mb-[7px] font-display text-[13px] font-semibold"></h3><small class="text-[11px] text-[#777]">${p.sizes?.[entry.variant]?.label||'Standard'}</small><div class="mt-[13px] flex items-center gap-[9px]"><button class="grid h-[25px] w-[25px] place-items-center bg-[#eee]" data-qty="${entry.key}" data-delta="-1" aria-label="Decrease">−</button><span>${entry.qty}</span><button class="grid h-[25px] w-[25px] place-items-center bg-[#eee]" data-qty="${entry.key}" data-delta="1" aria-label="Increase">+</button></div></div><button class="bg-transparent text-[#a22]" data-remove="${entry.key}" aria-label="Remove">×</button>`;div.querySelector('h3').textContent=p.name;lines.append(div)});$('#cartSubtotal').textContent=pounds(total)}
function changeQty(key,delta){const item=cart.find(x=>x.key===key);if(!item)return;item.qty=Math.min(99,item.qty+delta);if(item.qty<=0)cart=cart.filter(x=>x.key!==key);saveCart();renderCart();updateCartCount()}
function setSearchOpen(open){$('#searchPopup').hidden=!open;if(open){$('#searchInput').focus();renderSearch('')} }
function renderSearch(q){const root=$('#searchResults');root.replaceChildren();const link=$('#searchPageLink');link.href=q.trim()?`/search?q=${encodeURIComponent(q.trim())}`:'/search';if(!q.trim())return;const found=products.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())).slice(0,7);for(const p of found){const result=document.createElement('a');result.className='block w-full border-b border-[#eee] bg-transparent p-2.5 text-left text-xs hover:text-[#348a2e]';result.href=`/products/${p.slug}`;result.textContent=p.name+' · '+pounds(p.price);root.append(result)}if(!found.length)root.textContent='No matching products'}
function wire(){
 renderBenefits();renderBest();renderFeatured();setCategory('Personal Care');reviewsRender();addObserver($$('.reveal'));
 $('#heroPrev').onclick=()=>{heroShow(currentHero-1);heroPlay()};$('#heroNext').onclick=()=>{heroNext();heroPlay()};$$('#heroDots button').forEach(b=>b.onclick=()=>{heroShow(Number(b.dataset.slide));heroPlay()});$('#heroToggle').onclick=()=>setHeroPlaying(!heroPlaying);setHeroPlaying(heroPlaying);const hero=$('#homepageHero');hero.addEventListener('mouseenter',()=>clearInterval(heroTimer));hero.addEventListener('mouseleave',heroPlay);
 $('#featuredPrev').onclick=()=>moveFeatured(-1);$('#featuredNext').onclick=()=>moveFeatured(1);
 $('#cartTrigger').onclick=openCart;$('#searchTrigger').onclick=()=>setSearchOpen(true);$('#accountTrigger').onclick=()=>toast('Account integration is not included in this design preview.');
 $$('#categoryTabs button').forEach(b=>b.onclick=()=>setCategory(b.dataset.tab));
 $('#categoryPrev').onclick=()=>$('#categoryTrack').scrollBy({left:-350,behavior:'smooth'});$('#categoryNext').onclick=()=>$('#categoryTrack').scrollBy({left:350,behavior:'smooth'});
 $('#categoryTrack').addEventListener('scroll',()=>{const el=$('#categoryTrack');$('#categoryProgress').style.width=(35+(el.scrollLeft/Math.max(1,el.scrollWidth-el.clientWidth))*65)+'%'},{passive:true});
 $$('[data-slide-track]').forEach(b=>b.onclick=()=>$('#'+b.dataset.slideTrack).scrollBy({left:Number(b.dataset.direction)*320,behavior:'smooth'}));
 $('#reviewPrev').onclick=()=>{reviewIndex=(reviewIndex+reviews.length-1)%reviews.length;reviewsRender()};$('#reviewNext').onclick=()=>{reviewIndex=(reviewIndex+1)%reviews.length;reviewsRender()};
 document.addEventListener('click',e=>{const btn=e.target.closest('[data-open-product],[data-add-product],[data-qty],[data-remove],[data-close],[data-category]');if(!btn)return;if(btn.dataset.openProduct){const p=findItem(btn.dataset.openProduct);if(p)openProduct(p)}else if(btn.dataset.addProduct)addCart(btn.dataset.addProduct);else if(btn.dataset.qty)changeQty(btn.dataset.qty,Number(btn.dataset.delta));else if(btn.dataset.remove)changeQty(btn.dataset.remove,-999);else if(btn.dataset.close){if(btn.dataset.close==='cartDrawer')closeCart();if(btn.dataset.close==='productModal')closeProduct();if(btn.dataset.close==='searchPopup')setSearchOpen(false)}else if(btn.dataset.category){currentCategory=btn.dataset.category;renderBest();setCategory(btn.dataset.category)}});
 $('#cartScrim').onclick=closeCart;$('#productScrim').onclick=closeProduct;
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCart();closeProduct();setSearchOpen(false)}});
 $('#cartCheckout').onclick=()=>toast('This is a design preview. No payment or order was submitted.');
 $('#newsletterForm').onsubmit=e=>{e.preventDefault();$('#newsletterNotice').textContent='The email form is a design preview; no subscription was submitted.';toast('Newsletter service is not yet connected.');};
 $('#searchInput').addEventListener('input',e=>renderSearch(e.target.value));$('#searchForm').onsubmit=e=>{e.preventDefault();const q=$('#searchInput').value.trim();if(q)window.location.assign(`/search?q=${encodeURIComponent(q)}`)};
 window.addEventListener('scroll',()=>{const header=$('#siteHeader'),stuck=scrollY>130;header.classList.toggle('absolute',!stuck);header.classList.toggle('fixed',stuck);header.classList.toggle('top-[37px]',!stuck);header.classList.toggle('max-[550px]:top-[33px]',!stuck);header.classList.toggle('top-0',stuck);header.classList.toggle('max-[550px]:top-0',stuck);header.classList.toggle('bg-[#1b1b1bea]',stuck);header.classList.toggle('shadow-[0_4px_25px_#0002]',stuck)},{passive:true});
 updateCartCount();if(new URLSearchParams(location.search).get('cart')==='open')openCart();
}
wire();
