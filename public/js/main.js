$(function(){
    
    /**
     * 登录 注册切换
     */
    var $login=$('#login');
    var $register=$('#register');
    var reg = /^[^<>"'$\|?~*&@(){}]*$/;
    $('.j_userTab span').on('click',function(){
        var _index = $(this).index();//记录当前点击的所以
        $(this).addClass('user_cur').siblings().removeClass('user_cur');//给当前点击的span添加user_cur类 给它的兄弟元素移除这个类
        $('.user_login,.user_register').hide();//先将user_login和user_register同时隐藏
        if( _index==0 ){//如果当前点击的span的索引为0 那么就将user_login显示
            $('.user_login').css('display','inline-block');
            $('.user_register').hide();
        }else{//如果当前点击的span的索引不为0，那么就将user_register显示
            $('.user_login').hide();
            $('.user_register').css('display','inline-block');
        }
    });

 
    /**
     * 点击注册按钮的时候 通过ajax提交用户的注册数据 注册校验
     */
    $('.user_register_btn').on('click',function(){
        // 在类名为user_input的数组中的索引为0
        if( $register.find('.user_input').eq(0).find('input').val().trim() == '' ){
            $register.find('.user_err span').text('用户名不能为空').show();
            return false;
        }
        if( !reg.test($register.find('.user_input').eq(0).find('input').val().trim()) ){
            $register.find('.user_err span').text('用户名不能含有特殊字符').show();
            return false;
        }
        if( $register.find('.user_input').eq(1).find('input').val().trim() == '' ){
            $register.find('.user_err span').text('密码不能为空').show();
            return false;
        }
        if( !reg.test($register.find('.user_input').eq(1).find('input').val().trim()) ){
            $register.find('.user_err span').text('密码不能含有特殊字符').show();
            return false;
        }
        if( $register.find('.user_input').eq(1).find('input').val().trim() != 
            $register.find('.user_input').eq(2).find('input').val().trim()
        ){
            $register.find('.user_err span').text('两次输入的密码不一致').show();
            return false;
        }
        $.ajax({
            url:'/api/user/register',//其实这里就是对于后端路由的处理地址
            type:'post',
            data:{
                username:$register.find('[name="username"]').val(),
                password:$register.find('[name="password"]').val(),
                repassword:$register.find('[name="repassword"]').val()
            },
            dataType:'json',
            success:function(result){
                console.log(result);
                if(result.code != 0){//注册失败
                    $register.find('.user_err span').text( result.message ).show();
                    return false;
                }else{//注册成功 返回到登录页面
                    $register.find('.user_err span').text( result.message ).show();
                    setTimeout(()=>{
                        window.location.reload()
                    },1000)
                    
                }
            }
        })
    })

    /**
     * 点击登录按钮的时候 通过ajax提交用户的登录数据 登录校验
     */
    var $user_logined=$('.user_logined');
    $('.user_login_btn').on('click',function(){
        console.log('222222222222222222222');
        $.ajax({
            url:'/api/user/login',
            type:'post',
            data:{
                username:$login.find('[name="username"]').val(),
                password:$login.find('[name="password"]').val()
            },
            dataType:'json',
            success:function(result){
                if(!result.code){
                    // $login.find('.user_err span').text( result.message ).show();
                   
                    // setTimeout(()=>{
                    //     $login.hide();
                    //     $user_logined.show();
                    //     // 显示登录用户的信息
                    //     $('.user_welcome').eq(0).find('i').html(result.userInfo.username);
                    // },1000)   
                    
                    //登录成功后，刷新页面，重新发送请求
                    //显示登录成功样式

                    console.log('登录成功！！！');
                    console.log('111111111111111111');
                    window.location.reload();
                }
            }
        })
    })

    /**
     * 退出
     */
    $('#loginOut').on('click',function(){
        $.ajax({
            url:'/api/user/loginout',
            success:function(result){
                if(!result.code){//退出成功
                    window.location.reload();
                }
            }
        })
    })

})