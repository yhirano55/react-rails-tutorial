# React 初心者向けハンズオン

2017年5月25日

## ねらい

- **Rails x Reactの基礎**を理解
- gem `react-rails` を扱う

## やらないこと

- webpack, webpacker, es6, babel
- その他 難しそうな固有名詞

言わずもがなフロントエンドはトレンド技術を結集させればよいわけではない。

## ゴール

- イメージ先行気味のReactの招待を掴む
- React こわくないを理解する

## チュートリアル

### STEP 00: Clone

    $ git clone https://github.com/yhirano55/react-rails-tutorial.git

### STEP 01: Install

Gemfileに以下を追加して `bundle`:

    gem 'react-rails', '~> 2.2.0'

Generatorでインストール:

    $ bin/rails g react:install

### STEP 02: Hello, React

WelcomeControllerを生成

    $ bin/rails g controller welcome index

ルーティングを編集します。

    root 'welcome#index'

データベースをセットアップします。

    $ bin/rails db:create db:migrate

ReactComponentを生成します。

    $ bin/rails g react:component Hello message:string

コンポーネントをWelcome#indexから呼び出します。

    <%= react_component('Hello', message: 'Hello, React!') %>

`bin/rails server` で起動して http://localhost:3000 を確認すると...

![](https://cloud.githubusercontent.com/assets/15371677/26411655/5d3e7ac0-40e1-11e7-903d-b191b5977264.png)

### 技術解説 01: Reactはテンプレートエンジン

`app/assets/javascripts/components/hello.js.jsx` を確認すると...

```jsx
// Hello コンポーネントのClass
var Hello = React.createClass({
  // プロパティの型定義（キャストするわけではない）
  propTypes: {
    message: React.PropTypes.string
  },

  render: function() {
    // この部分がテンプレート
    // {} は <%= %> と同義
    return (
      <div>
        <div>Message: {this.props.message}</div>
      </div>
    );
  }
});
```

`react-rails` gemを利用していると、 `react_component` ヘルパーメソッドが利用できて、このコンポーネントを `<%= render partial: 'hello', locals: { message: 'Hello, React' } %>` と同じように扱うことができ、プロパティもオプション引数で渡すことができます。ほとんど、Railsのviewと同じです。

`Welcome#index` のHTMLソースを見てみると、renderで記述した要素が、HTMLファイルには書き出されていません。

```html
<div data-react-class="Hello" data-react-props="{&quot;message&quot;:&quot;Hello, React!&quot;}"></div>
```

react-railsを利用しない場合は、通常、次のように記述してレンダリングします。gemを利用することで、helperがこれと同じことを行っています。

```javascript
ReactDOM.render(
  <Hello />,
  document.getElementById('container')
);
```

なお、さきほどのreact_componentヘルパーを次のように書き換えてみると...

        <%= react_component('Hello', { message: 'Hello, React!' }, { prerender: true }) %>

画面は変わりませんが、HTMLを見てみると、先ほどは書き出されていなかった、renderで記述した要素が、HTMLファイルに書き出されていることが分かります。これがreact-railsの **サーバーサイドレンダリング** です。

```html
<div data-react-class="Hello" data-react-props="{&quot;message&quot;:&quot;Hello, React!&quot;}"><div data-reactroot="" data-reactid="1" data-react-checksum="724907937"><div data-reactid="2"><!-- react-text: 3 -->Message: <!-- /react-text --><!-- react-text: 4 -->Hello, React!<!-- /react-text --></div></div></div>
```

なお、サーバーサイドレンダリングの仕組みは、`execjs` に依存しています。

```ruby
react-rails (2.2.0)
    babel-transpiler (>= 0.7.0)
    connection_pool
    execjs
    railties (>= 3.2)
    tilt
```

### STEP 03: Reactコンポーネントを組み合わせる

Reactはコンポーネントを組み合わせて、機能を実現しています。たとえば、コメント機能だと

- リスト `CommentList`
  - 要素 `Comment`

といったコンポーネントで構成されます。facebookは殆どの要素をReactのコンポーネントで構成されていると言います。考えただけでも非常に複雑ですね。

さっそく各コンポーネントを生成してみましょう。

まずは、Commentから生成します。

    $ bin/rails g react:component Comment author:string

そして、`app/assets/javascripts/components/comment.js.jsx` を次のように書き換えます。

```jsx
var Comment = React.createClass({
  propTypes: {
    author: React.PropTypes.string
  },

  // 注: jsx内では `class=""` ではなく `className=""` となる
  render: function() {
    return (
      <div className="comment">
        <h2 className="commentAuthor">
          {this.props.author}
        </h2>
        {this.props.children}
      </div>
    );
  }
});
```

続いて、CommentListを生成します。

    $ bin/rails g react:component CommentList

そして、 `app/assets/javascripts/components/comment_list.js.jsx` を次のように書き換えます。

```jsx
var CommentList = React.createClass({
  render: function() {
    return (
      <div className="CommentList">
        <Comment author="alice">My name is Alice.</Comment>
        <Comment author="bob">My name is Bob.</Comment>
        <Comment author="carol">My name is Carol.</Comment>
      </div>
    );
  }
});
```

ここまでできたら、先ほどの `Welcome#index` から呼び出します。

    <%= react_component('CommentList') %>

![](https://cloud.githubusercontent.com/assets/15371677/26414019/c1c758ca-40e8-11e7-9d64-7af26c146f4d.png)

### STEP 04: APIからデータを渡す

コメントのデータをAPI経由で受け渡すように書き換えます。

まずは、Commentモデルを生成します（その後、`db:migrate` します）

    $ bin/rails g model Comment author content

続いて、コントローラを生成します。

    $ bin/rails g controller Api::V1::Comments index

ルーティングをresourceを使って書き直します。

```ruby
  namespace :api do
    namespace :v1 do
      resources :comments, only: :index
    end
  end
```

`app/controllers/api/v1/comments_controller.rb` を次のように修正します。

```ruby
class Api::V1::CommentsController < ApplicationController
  def index
    @comments = Comment.all
  end
end
```

jsonを返すため、`app/views/api/v1/comments/index.json.jbuilder` を新規で追加します。

```jbuilder
json.data(@comments) { |d| json.extract!(d, :id, :author, :content) }
```

ここまでできたら、コンソールから適当な値を流し込みます。

```ruby
10.times.each { |i| Comment.create(author: "author_#{i}", content: "content_#{i}") }
```

サーバーを起動し、 `curl http://localhost:3000/api/v1/comments.json` でJSONが返ってくることを確認します。

さて、続いては、コンポーネント側の実装です。 `CommentList` をラップする `CommentContainer` コンポーネントを生成します。

    $ bin/rails g react:component CommentContainer

実装は次の通りです。

```jsx
var CommentContainer = React.createClass({
  getInitialState: function() {
    return { data: [] };
  },
  componentDidMount: function() {
    fetch(this.props.url)
      .then(function(response) {
        if (!response.ok) throw new Error("invalid");
        return response.json();
      })
      .then(function(result) {
        this.setState({ data: result.data });
      }.bind(this))
      .catch(function(err) {
        console.error(err);
      }.bind(this));
  },
  render: function() {
    return (
      <div className="CommentContainer">
        <h1>Comments</h1>
        <CommentList data={this.state.data} />
      </div>
    );
  }
});
```

`app/assets/javascripts/components/comment_list.js.jsx` も書き換えます。

```jsx
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
```

最後に、 `app/views/welcome/index.html.erb` でCommentContainerコンポーネントを指定し、また、そのコンポーネントのプロパティに、APIのエンドポイントを渡します。

    <h1>Welcome#index</h1>
    <p>Find me in app/views/welcome/index.html.erb</p>

    <%= react_component('CommentContainer', url: '/api/v1/comments.json') %>

以上の実装を行うと下記のような画面になります。

![](https://cloud.githubusercontent.com/assets/15371677/26417218/824b8ce2-40f3-11e7-86ca-050583b92428.png)

以降、もしもフォームでcreateする方法などが気になりましたら、こちらのチュートリアルの元になった、『[react-railsを使ってReactのTutorialをやってみる - Qiita](http://qiita.com/joe-re/items/96f12dda4a62470d1d7c)』をご確認ください。

### 技術解説 02: 状態の管理について

Reactコンポーネント間の状態の管理は、ルート（例の場合だと、CommentContainer）にすべて集中させ、ルートより下のコンポーネントでは状態は管理せず、プロパティとして値を渡すのが、鉄則となっています。

ちょっとその前にReactのAPIを確認しましょう。

- getInitialState: 初期化時の状態を定義します。
- componentDidMount: コンポーネントのマウントにフックして処理が実行されます。APIのリクエストハンドリングなどはこちらで行います。
- setState(): 状態を更新します。

コンポーネントの状態管理がルートのみなので、状態の更新はバケツリレーのようなかたちで行われることになります。

![image](https://cloud.githubusercontent.com/assets/15371677/26418054/d283b52a-40f5-11e7-8791-73008106da7e.png)

ただ、これだとコンポーネントの深さに応じて、無駄が多いため、fluxというアーキテクチャを提唱しています。よく聞く、reduxはこちらの発展型と捉えてください。

![image](https://cloud.githubusercontent.com/assets/15371677/26418039/c591ffc0-40f5-11e7-8088-172a98a5b4b3.png)

今回は解説しませんが、詳しくは、[Reactの単純なサンプルでFluxの実装を解説 | maesblog](https://mae.chab.in/archives/2747)をご覧ください。

### 技術解説 03: ES6について

これまでのサンプルではすべて、ES5で紹介してきましたが、 コンポーネント生成時に `--es6` フラグを渡すと、ES6でファイルが生成されます（結局、babelによってトランスパイルされ、ES5になります）。ちょっとだけReactを使う場合では、無理して使うことはないと、個人的には思っています。

```es6
class Hello extends React.Component {
  render () {
    return (
      <div>
        <div>Message: {this.props.message}</div>
      </div>
    );
  }
}

Hello.propTypes = {
  message: React.PropTypes.string
};
```

以上となります。ありがとうございました。
