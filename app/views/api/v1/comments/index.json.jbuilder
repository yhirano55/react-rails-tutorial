json.data(@comments) { |d| json.extract!(d, :author, :content) }
