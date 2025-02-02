/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, PanelRow } from '@wordpress/components';
import { dispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useSharePost from '../../hooks/use-share-post';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import usePublicizeConfig from '../../hooks/use-publicize-config';

function cleanNotice() {
	dispatch( noticesStore ).removeNotice( 'publicize-post-share-message' );
}

function showErrorNotice( message = __( 'Unable to share the Post', 'jetpack' ) ) {
	const { createErrorNotice } = dispatch( noticesStore );
	createErrorNotice( message, {
		id: 'publicize-post-share-message',
	} );
}

function showSuccessNotice() {
	const { createSuccessNotice } = dispatch( noticesStore );
	createSuccessNotice( __( 'Post shared', 'jetpack' ), {
		id: 'publicize-post-share-message',
		type: 'snackbar',
	} );
}

export function SharePostButton( { isPublicizeEnabled } ) {
	const { hasEnabledConnections } = useSocialMediaConnections();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	const { isFetching, isError, isSuccess, doPublicize } = useSharePost();

	useEffect( () => {
		if ( isFetching ) {
			return;
		}

		if ( isError ) {
			return showErrorNotice();
		}

		if ( ! isSuccess ) {
			return;
		}

		showSuccessNotice();
	}, [ isFetching, isError, isSuccess ] );

	/*
	 * Disabled button when
	 * - sharing is disabled
	 * - no enabled connections
	 * - post is not published
	 * - is sharing post
	 */
	const isButtonDisabled =
		! isPublicizeEnabled || ! hasEnabledConnections || ! isPostPublished || isFetching;

	return (
		<Button
			isSecondary
			onClick={ function () {
				if ( ! isPostPublished ) {
					return showErrorNotice(
						__( 'You must publish your post before you can share it.', 'jetpack' )
					);
				}

				cleanNotice( 'publicize-post-share-message' );
				doPublicize();
			} }
			disabled={ isButtonDisabled }
			isBusy={ isFetching }
		>
			{ __( 'Share post', 'jetpack' ) }
		</Button>
	);
}

export function SharePostRow( { isPublicizeEnabled } ) {
	const { isRePublicizeFeatureEnabled } = usePublicizeConfig();

	if ( ! isRePublicizeFeatureEnabled ) {
		return null;
	}

	return (
		<PanelRow>
			<SharePostButton isPublicizeEnabled={ isPublicizeEnabled } />
		</PanelRow>
	);
}
