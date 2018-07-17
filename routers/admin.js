
var express=require('express');

var router=express.Router();

const mysql=require('mysql');

var db=mysql.createPool({host:'localhost',user:'root',password:'cmy19961106',database:'myblognode'})

// 当用户访问的是admin路由下的子路由user那么就执行以下逻辑

// 为了避免当前为非管理员的登录用户，直接通过网址路由访问的方式来访问我们的后台界面 
//所以我们要先判断访问后台的用户的req的userInfo对象中是否有isAdmin这一属性的值 这里的req有userInfo对象的原因也是 访问首页的时候
//在app.js中给req设置了一个userInfo对象
//如果登陆过 那么就会给req.userInfo赋值为cookies中的值

router.use((req,res,next)=>{//当访问到admin路由首先进行以下逻辑
    if(!req.userInfo.isAdmin){//判断当前登录用户是否为管理员
        res.send("对不起，只有管理员才能进入后台管理");
        return
    }
    next();//下一步
})

router.get('/',function(req,res,next){
    console.log('管理首页',req.userInfo)
    res.render('admin/index',{
        userInfo:req.userInfo
    });//因为在配置模板的时候就写了views 所以这里只需要写admin/index即可
})

/**
 * 用户管理
 * 从数据库中读取所有的用户数据
 * 将数据分配给user_index模板
 * 模板将数据渲染到dom上
 */
router.get('/user',(req,res,next)=>{

    // 用户请求的page是通过http的get请求 传递过来的参数决定的
    var page=Number(req.query.page||1);//当前页  这里请求过来的page是字符串
    var pages=0;//总页数
    var limit=2;//每页限制条数
    
    db.query(`SELECT COUNT(*) as count FROM user_table`,(err,data)=>{
        // console.log('data',data[0].count);

        //计算总页数
        pages=Math.ceil(data[0].count/limit);
        page=Math.min(page,pages);//取值不能超过pages 在page和pages中取一个较小数
        page=Math.max(page,1);//取值不会小于1

        db.query("SELECT * FROM user_table LIMIT "+(page-1)*limit+","+limit,(err,users)=>{
            if(err){
                res.status(500).send('database').end();
                return;
            }else{
                if(users.length>0){
                    // console.log(users);//一个含有所有注册信息的对象数组的集合
                    res.render('admin/user_index',{//因为在用户管理界面 还是会引入导航  依然需要登陆者的信息 所以还是要传递req.userInfo
                        userInfo:req.userInfo,
                        users:users,
                        page:page, //将后台的数据传递给前端渲染
                        count:data[0].count,
                        limit:limit,
                        pages:pages
                    })
                }
            }
        })
    })
    
})

/**
 * 分类首页
 * 
 */
router.get('/category',(req,res,next)=>{

    // 用户请求的page是通过http的get请求 传递过来的参数决定的
    var page=Number(req.query.page||1);//当前页  这里请求过来的page是字符串
    var pages=0;//总页数
    var limit=2;//每页限制条数
    
    db.query(`SELECT COUNT(*) as count FROM category_table`,(err,data)=>{
        // console.log('data',data[0].count);

        //计算总页数
        pages=Math.ceil(data[0].count/limit);
        page=Math.min(page,pages);//取值不能超过pages 在page和pages中取一个较小数
        page=Math.max(page,1);//取值不会小于1

        db.query("SELECT * FROM category_table ORDER BY id DESC LIMIT "+(page-1)*limit+","+limit,(err,categories)=>{
            if(err){
                res.status(500).send('database').end();
                return;
            }else{
                if(categories.length>0){
                    // console.log(users);//一个含有所有注册信息的对象数组的集合
                    res.render('admin/category_index',{//因为在用户管理界面 还是会引入导航  依然需要登陆者的信息 所以还是要传递req.userInfo
                        userInfo:req.userInfo,
                        categories:categories,
                        page:page, //将后台的数据传递给前端渲染
                        count:data[0].count,
                        limit:limit,
                        pages:pages
                    })
                }
            }
        })
    })

  
})

/**
 * 分类的添加
 * 
 */
router.get('/category/add',(req,res)=>{
    res.render('admin/category_add')
})

/**
 * 分类的保存
 */
router.post('/category/add',(req,res)=>{
    // console.log(req.body);
    var name=req.body.name||'';
    if(name==''){
        res.render('admin/error',{
            userInfo:req.userInfo,
            message:'名称不能为空'
        });
        return;
    }

    // 数据库中是否已经存在同名分类名称
    db.query(`SELECT * FROM category_table  WHERE name='${name}'`,(err,data)=>{
        if(err){
            res.status(500).send('database err').end();
        }else{
            if(data.length!=0){//说明数据库中已存在该分类名
                res.render('admin/error',{
                    userInfo:req.userInfo,
                    message:'该分类已存在'
                })
            }else{
                db.query(`INSERT INTO category_table (name) VALUES ('${name}')`,(err,data)=>{
                    console.log(data);
                    res.render('admin/success',{
                        userInfo:req.userInfo,
                        message:'分类添加成功',
                        url:'/admin/category'
                    })
                })
            }
        }
    })

})

/**
 * 分类修改：点击分类修改的时候  希望能够显示一个页面，该页面中有需要修改的该条数据的信息
 */
router.get('/category/edit',(req,res)=>{
    // 或许需要修改的分类信息，并且用表单的形式展示
    var id=req.query.id||'';

    console.log('id',id);
    // 获取要修改的分类信息 根据id来查找当前信息
    db.query(`SELECT * FROM  category_table WHERE id='${id}'`,(err,category)=>{
        console.log('category',category);
        if(category.length==0){//分类信息不存在
            res.render('admin/error',{
                userInfo:req.userInfo,
                message:'分类信息不存在'
            })
            return;
        }else{//分类信息存在时，渲染模板页
            res.render('admin/category_edit',{
                userInfo:req.userInfo,
                category:category[0]
            })
        }
    })
})


/**
 * 分类的修改保存
 */

router.post('/category/edit',(req,res)=>{
    
    var id=req.query.id || '';
    // 获取post提交过来新的分类名称
    var name=req.body.name;

    // 首先要在数据库中查找看当前需要修改的分类信息是否存在
    db.query(`SELECT * FROM  category_table WHERE id='${id}'`,(err,category)=>{
        console.log('category',category);
        if(category.length==0){//分类信息不存在
            res.render('admin/error',{
                userInfo:req.userInfo,
                message:'分类信息不存在'
            })
            return;
        }else{//提交了修改后的分类信息后，查找要修改的分类名称是否已经在数据库中存在
              //还有需要判断当前是否有修改
            if(name===category[0].name){//如果用户后来提交的修改后的名称和它未修改的名称一样 则不去做数据库操作，直接返回修改成功
                res.render('admin/success',{
                    userInfo:req.userInfo,
                    message:'修改成功',
                    url:'/admin/category'
                })
            }
            
            else{//判断修改后的分类名称是否是数据库中已存在的分类名称相同 如果数据库中已经有名称相同分类了，那么它需要满足id 和当前修改的
                //分类的id不同  但是名称要是一致的
                db.query(`SELECT * FROM category_table WHERE name='${name}'`,(err,data)=>{
                    if(err){
                        res.status(500).send('database err').end();
                    }else{
                        if(data.length!=0&&data[0].id!=id){//即可以在数据库中查找到和修改后的分类名称一致的名称 但又不是当前被修改的这条数据
                            res.render('admin/error',{
                                userInfo:req.userInfo,
                                message:'数据库中已存在该分类名称'
                            })
                        }else if(data.length==0){//数据库中并不存在和当前修改后的名称同名的名称
                            db.query(`UPDATE category_table SET name='${name}' WHERE id='${id}'`,(err,data)=>{
                                res.render('admin/success',{
                                    userInfo:req.userInfo,
                                    message:'修改成功',
                                    url:'/admin/category'
                                })
                            })
                        }
                    }
                })
            }
        }
    })
})

/**
 * 分类的删除
 */
router.get('/category/delete',(req,res)=>{
    var id=req.query.id || '';
    db.query(`DELETE FROM category_table WHERE id='${id}'`,(err,data)=>{
        res.render('admin/success',{
            userInfo:req.userInfo,
            message:'成功',
            url:'/admin/category'
        })
    })
})

/**
 * 博客内容管理
 */
router.get('/content',(req,res)=>{

    // 获取数据库中的内容数据  添加到首页
    // 用户请求的page是通过http的get请求 传递过来的参数决定的
    var page=Number(req.query.page||1);//当前页  这里请求过来的page是字符串
    var pages=0;//总页数
    var limit=2;//每页限制条数
    
    db.query(`SELECT COUNT(*) as count FROM content_table`,(err,data)=>{
        // console.log('data',data[0].count);

        //计算总页数
        pages=Math.ceil(data[0].count/limit);
        page=Math.min(page,pages);//取值不能超过pages 在page和pages中取一个较小数
        page=Math.max(page,1);//取值不会小于1

        db.query("SELECT * FROM content_table ORDER BY id DESC LIMIT "+(page-1)*limit+","+limit,(err,contents)=>{
            if(err){
                res.status(500).send('database').end();
                return;
            }else{
                if(contents.length>=0){
                    console.log('contents',contents);
                    res.render('admin/content_index',{//因为在用户管理界面 还是会引入导航  依然需要登陆者的信息 所以还是要传递req.userInfo
                        userInfo:req.userInfo,
                        contents:contents,
                        page:page, //将后台的数据传递给前端渲染
                        count:data[0].count,
                        limit:limit,
                        pages:pages
                    })
                }
            }
        })
    })

})

/**
 * 添加博客内容页面
 */

router.get('/content/add',(req,res)=>{

    // 需要在数据库中查询所有分类信息  传递给前台 放入下拉框
    db.query(`SELECT * FROM category_table ORDER BY id DESC `,(err,categories)=>{
        if(err){
            res.status(500).send('database err').end();
        }else{
            if(categories.length!=0){
                res.render('admin/content_add',{
                    userInfo:req.userInfo,
                    categories:categories
                })
            }
        }
    })

   
})

/**
 * 添加内容保存
 */
router.post('/content/add',(req,res)=>{
    var category=req.body.category;
    var title=req.body.title;
    var content=req.body.content;
    var description=req.body.description;
    var view=0;
    var username=req.userInfo.username;
    console.log('username',username)

    // 对提交的数据进行验证，不能为空
    if(category==''){
        res.render('admin/error',{
            userInfo:req.userInfo,
            message:'分类内容不能为空'
        })
    }

    if(title==''){
        res.render('admin/error',{
            userInfo:req.userInfo,
            message:'内容标题不能为空'
        })
    }

    if(content==''){
        res.render('admin/error',{
            userInfo:req.userInfo,
            message:'文章内容不能为空'
        })
    }

    // 保存数据到数据库
    db.query(`INSERT INTO content_table (title,category,content,view,description,user) VALUES ('${title}','${category}','${content}','${view}','${description}','${username}')`,(err,data)=>{
        if(err){
            res.status(500).send('database err').end()
        }else{
            res.render('admin/success',{
                userInfo:req.userInfo,
                message:'文章内容添加成功',
                url:'/admin/content'
            })
        }
    })

})

/**
 * 显示需要修改的内容
 */
router.get('/content/edit',(req,res)=>{
    var id=req.query.id||'';

    // 读取分类表中的数据 渲染到option下拉框中
    db.query(`SELECT * FROM category_table ORDER BY id DESC`,(err,categories)=>{
        if(err){
            res.status(500).send('database err').end()
        }else{
            if(categories.length!=0){
                db.query(`SELECT * FROM content_table WHERE id='${id}'`,(err,content)=>{
                    if(err){
                        res.status(500).send('database err').end();
                    }else{
                        if(content.length==0){
                            res.render('admin/error',{
                                userInfo:req.userInfo,
                                message:'指定内容不存在'
                            })
                        }else{
                            console.log('content',content)
                            res.render('admin/content_edit',{//将此时指定内容的信息先存入content_edit表中
                                userInfo:req.userInfo,
                                content:content[0],
                                categories:categories
                            })
                        }
                    }
                })
            }
            
        }
    })

    
})

/**
 * 保存修改内容
*/
router.post('/content/edit',(req,res)=>{
    var category=req.body.category;
    var title=req.body.title;
    var content=req.body.content;
    var description=req.body.description;
    var view=0;
    var id=req.query.id || ''

    // 对提交的数据进行验证，不能为空
    if(category==''){
        res.render('admin/error',{
            userInfo:req.userInfo,
            message:'分类内容不能为空'
        })
    }

    if(title==''){
        res.render('admin/error',{
            userInfo:req.userInfo,
            message:'内容标题不能为空'
        })
    }

    if(content==''){
        res.render('admin/error',{
            userInfo:req.userInfo,
            message:'文章内容不能为空'
        })
    }

    // 保存数据到数据库
    db.query(`UPDATE content_table SET title='${title}',category='${category}',content='${content}',description='${description}' WHERE id='${id}'`,(err,data)=>{
        if(err){
            res.status(500).send('database err').end();
        }else{
            res.render('admin/success',{
                userInfo:req.userInfo,
                message:'内容修改成功',
                url:'/admin/content'
            })
        }
    })
})

/**
 * 内容删除
 */

router.get('/content/delete',(req,res)=>{
    var id=req.query.id;
    db.query(`DELETE FROM content_table WHERE id='${id}'`,(err,data)=>{
        if(err){
            res.status(500).send('database err').end();
        }else{
            res.render('admin/success',{
                userInfo:req.userInfo,
                message:'内容删除成功',
                url:'/admin/content'
            })
        }
    })
})

module.exports=router;