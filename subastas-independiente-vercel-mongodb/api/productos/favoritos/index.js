const {getDb}=require('../../../lib/db');
const {requireUser}=require('../../../lib/auth');
const {method,error}=require('../../../lib/http');
module.exports=async(req,res)=>{if(!method(req,res,['GET']))return;try{const db=await getDb();const user=await requireUser(req,res,db);if(!user)return;const items=await db.collection('favoritos').find({usuarioId:user._id}).sort({creadoEn:-1}).toArray();const ids=items.map(x=>x.productoId);const ps=await db.collection('productos').find({_id:{$in:ids},estado:'activo'}).toArray();const productos=ps.map(p=>({id:String(p._id),nombre:p.nombre,precio:p.precio,imagen:p.imagenData?`/api/imagen/${p._id}`:p.imagen,vendedor:p.vendedor}));res.json({productos});}catch(e){error(res,e);}};
