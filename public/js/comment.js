$(function(){

    /**
     * 在前端进行分页
     */

    var perpage=3;//每页限制数
    var page=1;//当前页数
    var pages=0;//总页数
    var comments=[];//所有评论

    /**
     * 点击提交评论的按钮的时候就发送ajax请求
     */
    $('.discuss_submit').click(function(){
            $.ajax({
                type:'post',
                url:'/api/comment/post',
                data:{
                    articleId:$('.discuss_Id').val(),
                    content:$('.discuss_input').val()
                },
                success:function(responseData){
                    // 当评论成功提交以后 我们文本框中的内容应该清空  同时最新的评论应该在评论列表的最上面
                    $('.discuss_input').val('');
                    comments=responseData.data;
                    renderComment();
                }
            })
        })

    /**
     *每次页面重载的时候获取一下该文章的所有评论     
    */
    $.ajax({
        url:'/api/comment',
        data:{
            articleId:$('.discuss_Id').val(),
        },
        success:function(responseData){
            $('.discuss_input').val('');
            comments=responseData.data;
            renderComment();
        }
    })

    /**
     * 点击a标签的时候 可以利用事件委托 委托给父元素ul
     */
    $('.pager').delegate('a','click',function(){
        if($(this).parent().hasClass('previous')){
            page--;
            console.log('page--',page);
        }else{
            page++;
            console.log('page++',page);
        }

        renderComment();
    })

    /**
     * 渲染评论列表
     */
    function renderComment(){
        var $li=$('li');
        // 在循环添加新的li之前先清空ul
        $('.discuss_list').html('');
        $('.discuss_count i').html(comments.length);

        // 详细页的评论量
        $('.countAll').html('评价：'+comments.length);

        // 总页数
        pages=Math.max(Math.ceil(comments.length/perpage),1);

        var start=Math.max(0,(page-1)*perpage);
        var end=Math.min(start+perpage,comments.length);

        for(var i=start;i<end;i++){
            $li='<li style="border-bottom:1px solid #eee"><i style="margin-right:10px">'+comments[i].username+'</i><i style="color:#888;float:right;margin-right:30px;">'+comments[i].postTime+'</i><p style="margin-top:10px">'+comments[i].content+'</p></li>'
            $('.discuss_list').append($li);
        }
        var $lis=$('.pager li');
        $lis.eq(1).html(page+' / '+pages);

        /**
         * 如果想从前台控制分页  可以通过控制for循环的循环开始值和循环结束的值
         */
        

        if(page<=1){
            page=1;
            $('.nopre').attr("disabled",true);
            $('.nopre').css({"pointer-events":"none","color":"#ccc"});
        }else{
            $('.nopre').attr("disabled",false);
            $('.nopre').css({"pointer-events":"auto","color":"blue"});
        }
        console.log('pages',pages);
        if(page>=pages){
            page=pages;
            $('#nonext').attr("disabled",true);
            $('#nonext').css({"pointer-events":"none","color":"#ccc"});
        }else{
            $('#nopre').attr("disabled",false);
            $('#nopre').css({"pointer-events":"auto","color":"blue"});
        }
    }

    /**
     * 格式化日期对象
     */
    function formatDate(d){
        var date1=new Date(d);
        return date1.getFullYear()+'年'+(date1.getMonth()+1)+'月'+date1.getDate()+'日'+date1.getHours()+':'+date1.getMinutes()+':'+date1.getSeconds()
    }
})
        
