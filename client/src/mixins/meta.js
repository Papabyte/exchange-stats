export default {
	methods: {
		setTitle: function(title){
			document.title = title
		},
		setMetaDescription: function(description){
			document.getElementsByName('description')[0].setAttribute('content', description);
		},
		setRobotDirective: function(directive){
			document.getElementsByName('robots')[0].setAttribute('content', directive)		
		}

	}
}