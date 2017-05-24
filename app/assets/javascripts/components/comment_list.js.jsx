var CommentList = React.createClass({
  render: function() {
    var comments = this.props.data.map(function(comment) {
      return (
        <Comment author={comment.author} key={comment.id}>
          {comment.content}
        </Comment>
      );
    });
    return (
      <div className="CommentList">
        {comments}
      </div>
    );
  }
});
