/**
 * 渲染用户页面
 */

var express=require('express');
var router=express.Router();

// 加载数据库模块
const mysql=require('mysql');

//连接数据库
var db=mysql.createPool({host:'localhost',user:'root',password:'cmy19961106',database:'myblognode'})

var data;

/**
 * 注意：前台页面导航栏的信息应该是访问前台中任意页面均可以展示的数据 所以用中间件表示
 */
router.use((req,res,next)=>{

    // 通用数据
    data={
        userInfo:req.userInfo,
        categories:[],
        
    }

    db.query(`SELECT * FROM category_table ORDER BY id DESC`,(err,categories)=>{
        if(err){
            res.status(500).send('2222 database err').end();
        }else{
            if(categories.length>=0){
                
                data.categories=categories;
                next();
            }
        }
    })
})


// 当访问的绝对路径为/时  执行以下操作 读取views/main/index.html文件  并将读取的内容返回给前端
router.get('/',function(req,res,next){

    // 访问首页的时候
    console.log('访问首页',req.userInfo);//此时req.userInfo里面应该有_id username isAdmin三个键值对

    data.type=req.query.type||'',
    data.page=Number(req.query.page||1),
    data.limit=4,
    data.pages=0,
    data.count=0

    // 前台内容分页 先查询content的总数
    db.query(`SELECT COUNT(*) as count FROM content_table`,(err,counts)=>{
        if(err){
            res.status(500).send('1111 database err').end()
        }else{
            data.count=counts[0].count;//查询到content文章总数后

            //计算总页数
            data.pages=Math.ceil(data.count/data.limit);
            data.page=Math.min(data.page,data.pages);//取值不能超过pages 在page和pages中取一个较小数
            data.page=Math.max(data.page,1);//取值不会小于1

            // 如果点击了首页的分类导航 那么就按照分页导航所找到的数据显示
            if(data.type!=''){
                db.query("SELECT * FROM content_table WHERE category='"+data.type+"' ORDER BY id DESC LIMIT "+(data.page-1)*data.limit+","+data.limit,(err,contents)=>{
                    if(err){
                        res.status(500).send('database 3333').end();
                        return;
                    }else{
                        if(contents.length>0){
    
                            data.contents=contents;
                            res.render('main/index',data);
                            
                        }
                    }
                })
            }
            else{// 限制分页 没有点击首页导航  不需要分类展示
                db.query("SELECT * FROM content_table ORDER BY id DESC LIMIT "+(data.page-1)*data.limit+","+data.limit,(err,contents)=>{
                    if(err){
                        res.status(500).send('database 3333').end();
                        return;
                    }else{
                        if(contents.length>0){
    
                            data.contents=contents;
                            res.render('main/index',data);
                            
                        }
                    }
                })
            }


            
            
        }
    })

    
})

/**
 * 阅读全文
 */

router.get('/views',(req, res, next)=>{
    const _id = req.query.page;
    // 查询结果为一条数据的时候一定要注意！！将查询到的结果加上article[0]才能获取对象中的数据
    db.query(`SELECT * FROM content_table WHERE id='${_id}'`,(err,article)=>{
        if(err){
            res.status(500).send('database err').end();
        }else{
            if(article.length!=0){
                data.article=article;
                article[0].view++;

                console.log('view',article[0].view);

                db.query(`UPDATE content_table SET view='${article[0].view}' WHERE id='${_id}'`,(err,view)=>{
                    if(err){
                        res.status(500).send('database err').end();
                    }else{
                        console.log('article',data);
                        res.render('main/view',data);
                    }
                    
                })
                
            }
        }
    })
    
})

module.exports=router;