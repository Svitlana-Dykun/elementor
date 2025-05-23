import Document from '../../document';
import Heartbeat from 'elementor-editor-utils/heartbeat';

export class Load extends $e.modules.CommandInternalBase {
	validateArgs( args = {} ) {
		this.requireArgument( 'config', args );
	}

	apply( args ) {
		const { config, setAsInitial = false, shouldScroll = true, shouldNavigateToDefaultRoute = true } = args;

		if ( elementorCommon.config.experimentalFeatures.additional_custom_breakpoints ) {
			// When the Responsive Optimization experiment is active, the responsive controls are generated on the
			// JS side instead of the PHP.
			config.settings.controls = elementor.generateResponsiveControls( config.settings.controls );
		}

		elementor.config.document = config;

		elementor.setAjax();

		elementor.addWidgetsCache( config.widgets );

		elementor.templates.init();

		const document = new Document( config );

		elementor.documents.add( document );

		// Must set current before create a container.
		elementor.documents.setCurrent( document );

		if ( setAsInitial ) {
			elementor.documents.setInitialById( document.id );
		}

		elementor.settings.page = new elementor.settings.modules.page( config.settings );

		document.container = elementor.settings.page.getEditedView().getContainer();

		// Reference container back to document.
		document.container.document = document;

		elementor.heartbeat = new Heartbeat( document );

		const isOldPageVersion = elementor.config.document.version &&
			elementor.helpers.compareVersions( elementor.config.document.version, '2.5.0', '<' );

		if ( ! elementor.config.user.introduction.flexbox && isOldPageVersion ) {
			elementor.showFlexBoxAttentionDialog();
		}

		if ( elementor.loaded ) {
			// TODO: Find better solution - Fix issue when globals does not render after saving from kit.
			// The issue is that the css-parser is depends upon cache and cache is not available during this time.
			return $e.data.get( 'globals/index' ).then( () => {
				if ( setAsInitial ) {
					// There is no need to attach preview when the iframe is reloaded. It will be triggered
					// automatically after the iframe finishes loading (see `EditorBase.onPreviewLoaded()`).
					elementor.reloadPreview();

					return Promise.resolve();
				}

				return $e.internal( 'editor/documents/attach-preview', {
					shouldScroll,
					shouldNavigateToDefaultRoute,
					selector: args.selector,
				} );
			} );
		}

		return Promise.resolve( document );
	}
}

export default Load;
