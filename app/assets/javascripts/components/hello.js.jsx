var Hello = React.createClass({
  propTypes: {
    message: React.PropTypes.string
  },

  render: function() {
    return (
      <div>
        <div>Message: {this.props.message}</div>
      </div>
    );
  }
});

