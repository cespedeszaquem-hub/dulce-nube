import { useEffect, useState } from 'react'
import { supabase, ready } from './supabase'
import { IceCreamCone, Carrot, ShoppingCart, House, LogOut, Plus, Pencil, Trash2, Menu, X, RefreshCw } from 'lucide-react'
const money = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n||0))

export default function App(){
 const [session,setSession]=useState(null),[profile,setProfile]=useState(null),[tab,setTab]=useState('inicio'),[menu,setMenu]=useState(false)
 const [products,setProducts]=useState([]),[ingredients,setIngredients]=useState([]),[sales,setSales]=useState([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
 const [caloriasPorProducto, setCaloriasPorProducto] = useState({});
 const [email,setEmail]=useState(''),[password,setPassword]=useState('')
 const [ingredient,setIngredient]=useState({nombre:'',precio:'',calorias:'',inventario:'',tipo:''}),[editIng,setEditIng]=useState(null)
 const [product,setProduct]=useState({nombre:'',precio_publico:'',tipo:'',vaso:'',volumen_onzas:''}),[editProd,setEditProd]=useState(null)
 const [sale,setSale]=useState({producto:'',cantidad:1})
 useEffect(()=>{if(!ready)return;supabase.auth.getSession().then(({data})=>setSession(data.session));const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>subscription.unsubscribe()},[])
 useEffect(()=>{if(session)loadData();else{setProfile(null);setProducts([]);setIngredients([]);setSales([])}},[session])
 async function loadData() {
  setBusy(true);
  setMessage('');

  try {
    const [p, i, s, pr, cal] = await Promise.all([
      supabase.from('productos').select('*').order('nombre'),
      supabase.from('ingredientes').select('*').order('nombre'),
      supabase.from('ventas').select('*').order('fecha', { ascending: false }),
      supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
      supabase.from('v_calorias_producto').select('producto_id,total_calorias')
    ]);

    for (const r of [p, i, s, pr, cal]) {
      if (r.error) throw r.error;
    }

    setProducts(p.data || []);
    setIngredients(i.data || []);
    setSales(s.data || []);
    setProfile(pr.data || {
      nombre: session.user.email,
      rol: 'usuario'
    });

    const mapaCalorias = {};
    for (const fila of cal.data || []) {
      mapaCalorias[fila.producto_id] = fila.total_calorias;
    }
    setCaloriasPorProducto(mapaCalorias);

  } catch (e) {
    setMessage('No se pudieron cargar los datos: ' + e.message);
  } finally {
    setBusy(false);
  }
}
 async function login(e){e.preventDefault();const {error}=await supabase.auth.signInWithPassword({email,password});if(error)setMessage(error.message)}
 async function saveIngredient(e){e.preventDefault();const payload={nombre:ingredient.nombre.trim(),precio:Number(ingredient.precio||0),calorias:Number(ingredient.calorias||0),inventario:Number(ingredient.inventario||0),tipo:ingredient.tipo||null};const q=editIng?supabase.from('ingredientes').update(payload).eq('id',editIng):supabase.from('ingredientes').insert(payload);const {error}=await q;if(error)return setMessage(error.message);setIngredient({nombre:'',precio:'',calorias:'',inventario:'',tipo:''});setEditIng(null);setMessage('Ingrediente guardado.');loadData()}
 async function removeIngredient(id){if(!confirm('¿Eliminar este ingrediente?'))return;const {error}=await supabase.from('ingredientes').delete().eq('id',id);setMessage(error?.message||'Ingrediente eliminado.');if(!error)loadData()}
 async function saveProduct(e){e.preventDefault();const payload={nombre:product.nombre.trim(),precio_publico:Number(product.precio_publico||0),tipo:product.tipo||null,vaso:product.vaso||null,volumen_onzas:Number(product.volumen_onzas||0)};const q=editProd?supabase.from('productos').update(payload).eq('id',editProd):supabase.from('productos').insert(payload);const {error}=await q;if(error)return setMessage(error.message);setProduct({nombre:'',precio_publico:'',tipo:'',vaso:'',volumen_onzas:''});setEditProd(null);setMessage('Producto guardado.');loadData()}
 async function removeProduct(id){if(!confirm('¿Eliminar este producto?'))return;const {error}=await supabase.from('productos').delete().eq('id',id);setMessage(error?.message||'Producto eliminado.');if(!error)loadData()}
 async function registerSale(e){e.preventDefault();const p=products.find(x=>String(x.id)===String(sale.producto));if(!p)return setMessage('Selecciona un producto.');const qty=Math.max(1,Number(sale.cantidad||1));const {error}=await supabase.from('ventas').insert({producto:p.nombre,user_id:session.user.id,fecha:new Date().toISOString(),cantidad:qty,total:Number(p.precio_publico||0)*qty});if(error)return setMessage('No se pudo registrar: '+error.message);setSale({producto:'',cantidad:1});setMessage('Venta registrada.');loadData()}
 if(!ready)return <div className="center"><section className="login"><div className="cloud">☁</div><h1>Dulce Nube</h1><p>Primero conecta Supabase.</p><ol><li>Copia el archivo <b>.env.example</b> y renómbralo a <b>.env</b>.</li><li>En Supabase abre <b>Project Settings → API</b>.</li><li>Pega Project URL y la clave pública anon/publishable en el archivo .env.</li><li>No uses la clave service_role.</li></ol></section></div>
 if(!session)return <div className="center"><form className="login" onSubmit={login}><div className="cloud">☁</div><h1>Dulce Nube</h1><p>Inicia sesión para continuar</p><label>Correo<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Contraseña<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button className="primary wide">Iniciar sesión</button>{message&&<p className="error">{message}</p>}</form></div>
 const admin = profile?.rol === 'admin';
const empleado = profile?.rol === 'empleado';
const cliente = profile?.rol === 'cliente';
const puedeAdministrar = admin || empleado;
 const tabsPermitidas = cliente
  ? ['productos', 'ventas']
  : ['inicio', 'productos', 'ingredientes', 'ventas'];

const tabActual = tabsPermitidas.includes(tab)
  ? tab
  : 'productos';

const nav = [
  ['inicio', 'Inicio', House],
  ['productos', 'Productos', IceCreamCone],
  ['ingredientes', 'Ingredientes', Carrot],
  ['ventas', 'Ventas', ShoppingCart]
].filter(([id]) => {
  if (cliente) return ['productos', 'ventas'].includes(id);
  return true;
});
 return <div className="layout"><aside className={'sidebar '+(menu?'show':'')}><div className="brand"><span>☁</span> Dulce Nube <button className="close" onClick={()=>setMenu(false)}><X/></button></div><nav>{nav.map(([id,label,Icon])=><button key={id} className={tab===id?'selected':''} onClick={()=>{setTab(id);setMenu(false)}}><Icon size={18}/>{label}</button>)}</nav><div className="user"><b>{profile?.nombre||session.user.email}</b><small>{profile?.rol||'usuario'}</small><button onClick={()=>supabase.auth.signOut()}><LogOut size={16}/> Cerrar sesión</button></div></aside>{menu&&<div className="shade" onClick={()=>setMenu(false)}/>}
 <main><header><button className="hamb" onClick={()=>setMenu(true)}><Menu/></button>Administración<button className="refresh" onClick={loadData}><RefreshCw size={17}/></button></header><div className="content">{message&&<div className="message">{message}<button onClick={()=>setMessage('')}>×</button></div>}{busy&&<p className="muted">Cargando…</p>}
 {tabActual==='inicio'&&<><h1>¡Hola! Bienvenido 👋</h1><p className="muted">Administra tus productos y ventas.</p><div className="stats"><Stat icon={<IceCreamCone/>} label="Productos" value={products.length}/><Stat icon={<Carrot/>} label="Ingredientes" value={ingredients.length}/><Stat icon={<ShoppingCart/>} label="Ventas" value={sales.length}/><Stat icon={<ShoppingCart/>} label="Total vendido" value={money(sales.reduce((a,s)=>a+Number(s.total||0),0))}/></div><section className="panel"><h2>Menú principal</h2><div className="shortcuts">{nav.slice(1).map(([id,label,Icon])=><button onClick={()=>setTab(id)} key={id}><Icon/>{label}</button>)}</div></section></>}
 {tabActual==='ingredientes'&&<><Title title="Ingredientes" sub="Registra y administra los ingredientes."/>{puedeAdministrar&&<form className="panel form" onSubmit={saveIngredient}><h2>{editIng?'Editar ingrediente':'Nuevo ingrediente'}</h2><label>Nombre<input value={ingredient.nombre} onChange={e=>setIngredient({...ingredient,nombre:e.target.value})} required/></label><label>Precio<input type="number" min="0" value={ingredient.precio} onChange={e=>setIngredient({...ingredient,precio:e.target.value})} required/></label><label>Calorías<input type="number" min="0" value={ingredient.calorias} onChange={e=>setIngredient({...ingredient,calorias:e.target.value})}/></label><label>Inventario<input type="number" min="0" value={ingredient.inventario} onChange={e=>setIngredient({...ingredient,inventario:e.target.value})}/></label><label>Tipo<input value={ingredient.tipo} onChange={e=>setIngredient({...ingredient,tipo:e.target.value})}/></label><div className="actions"><button className="primary"><Plus size={16}/>Guardar</button>{editIng&&<button type="button" className="secondary" onClick={()=>{setEditIng(null);setIngredient({nombre:'',precio:'',calorias:'',inventario:'',tipo:''})}}>Cancelar</button>}</div></form>}<section className="panel"><h2>Listado de ingredientes</h2><div className="tablebox"><table><thead><tr><th>Nombre</th><th>Precio</th><th>Calorías</th><th>Inventario</th><th>Tipo</th>{admin&&<th>Acciones</th>}</tr></thead><tbody>{ingredients.map(x=><tr key={x.id}><td>{x.nombre}</td><td>{money(x.precio)}</td><td>{x.calorias??'—'}</td><td>{x.inventario??'—'}</td><td>{x.tipo||'—'}</td>{admin&&<td><button className="iconbtn" onClick={()=>{setEditIng(x.id);setIngredient({nombre:x.nombre||'',precio:x.precio??'',calorias:x.calorias??'',inventario:x.inventario??'',tipo:x.tipo||''})}}><Pencil size={16}/></button><button className="iconbtn" onClick={()=>removeIngredient(x.id)}><Trash2 size={16}/></button></td>}</tr>)}{!ingredients.length&&<tr><td colSpan={puedeAdministrar?6:5} className="empty">No hay ingredientes registrados.</td></tr>}</tbody></table></div></section></>}
 {tabActual==='productos'&&<><Title title="Productos" sub="Consulta y administra los productos disponibles."/>{puedeAdministrar&&<form className="panel form" onSubmit={saveProduct}><h2>{editProd?'Editar producto':'Nuevo producto'}</h2><label>Nombre<input value={product.nombre} onChange={e=>setProduct({...product,nombre:e.target.value})} required/></label><label>Precio público<input type="number" min="0" value={product.precio_publico} onChange={e=>setProduct({...product,precio_publico:e.target.value})} required/></label><label>Tipo<input value={product.tipo} onChange={e=>setProduct({...product,tipo:e.target.value})}/></label><label>Vaso<input value={product.vaso} onChange={e=>setProduct({...product,vaso:e.target.value})}/></label><label>Volumen (onzas)<input type="number" min="0" value={product.volumen_onzas} onChange={e=>setProduct({...product,volumen_onzas:e.target.value})}/></label><div className="actions"><button className="primary"><Plus size={16}/>Guardar</button>{editProd&&<button type="button" className="secondary" onClick={()=>{setEditProd(null);setProduct({nombre:'',precio_publico:'',tipo:'',vaso:'',volumen_onzas:''})}}>Cancelar</button>}</div></form>}<div className="productgrid">{products.map(p=><article className="product" key={p.id}><div className="producticon"><IceCreamCone/></div><h3>{p.nombre}</h3><b>{money(p.precio_publico)}</b><p>{p.tipo||'Producto'} {p.volumen_onzas?`· ${p.volumen_onzas} oz`:''}</p> <p>🔥 Calorías: {caloriasPorProducto[p.id] ?? 'No disponibles'} kcal</p>{admin&&<div><button className="iconbtn" onClick={()=>{setEditProd(p.id);setProduct({nombre:p.nombre||'',precio_publico:p.precio_publico??'',tipo:p.tipo||'',vaso:p.vaso||'',volumen_onzas:p.volumen_onzas??''})}}><Pencil size={16}/></button><button className="iconbtn" onClick={()=>removeProduct(p.id)}><Trash2 size={16}/></button></div>}</article>)}{!products.length&&<section className="panel muted">Todavía no hay productos registrados.</section>}</div></>}
 {tabActual==='ventas'&&<><Title title="Ventas" sub="Registra una venta y consulta el historial."/><form className="panel form" onSubmit={registerSale}><h2>Registrar venta</h2><label>Producto<select value={sale.producto} onChange={e=>setSale({...sale,producto:e.target.value})} required><option value="">Selecciona un producto</option>{products.map(p=><option key={p.id} value={p.id}>{p.nombre} — {money(p.precio_publico)}</option>)}</select></label><label>Cantidad<input type="number" min="1" value={sale.cantidad} onChange={e=>setSale({...sale,cantidad:e.target.value})}/></label><div className="actions"><button className="primary"><ShoppingCart size={16}/>Registrar venta</button></div><p className="muted">El total se calcula con el precio público del producto.</p></form><section className="panel"><h2>Historial de ventas</h2><div className="tablebox"><table><thead><tr><th>Producto</th><th>Fecha</th><th>Cantidad</th><th>Total</th></tr></thead><tbody>{sales.map(s=><tr key={s.id}><td>{s.producto}</td><td>{s.fecha?new Date(s.fecha).toLocaleString('es-CO'):'—'}</td><td>{s.cantidad}</td><td>{money(s.total)}</td></tr>)}{!sales.length&&<tr><td colSpan="4" className="empty">No hay ventas registradas.</td></tr>}</tbody></table></div></section></>}
 </div></main></div>
}
function Stat({icon,label,value}){return <div className="stat"><span>{icon}</span><div><small>{label}</small><b>{value}</b></div></div>}
function Title({title,sub}){return <div className="title"><h1>{title}</h1><p>{sub}</p></div>}
