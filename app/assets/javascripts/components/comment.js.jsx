var Comment = React.createClass({
  propTypes: {
    author: React.PropTypes.string
  },

  render: function() {
    return (
      <div>
        <div>Author: {this.props.author}</div>
      </div>
    );
  }
});

