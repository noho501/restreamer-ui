import React from 'react';

import { Trans } from '@lingui/macro';
import makeStyles from '@mui/styles/makeStyles';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Avatar } from '@mui/material';

import Paper from '../../misc/Paper';
import PaperHeader from '../../misc/PaperHeader';

const useStyles = makeStyles((theme) => ({
	viewerCount: {
		fontSize: '3.5rem',
		fontWeight: 600,
	},
	vierwerDescription: {
		marginTop: '-1em',
	},
	vierwerTypo: {
		fontSize: '1.1rem',
	},
	comment: {
		fontSize: '1rem',
		margin: 0,
	},
	commentUser: {
		fontSize: '1rem',
	},
	bandwidth: {
		marginBottom: '.3em',
	},
	bandwidthCount: {
		fontSize: '2.5rem',
		fontWeight: 600,
	},
	bandwidthDescription: {
		marginTop: '-.5em',
	},
	bandwidthIcon: {
		fontSize: '1.7rem',
		paddingRight: 7,
	},
}));

const Comment = ({ message, from: { name } = { name: '' }, picture }) => {
	const classes = useStyles();

	return (
		<Grid container spacing={1}>
			<Grid item xs={12}>
				<Divider />
				<Grid container direction="column" className={classes.boxComment} gap="4px" marginBottom="16px">
					<p className={classes.comment}>{message}</p>
					<Grid container direction="row" gap="4px">
						<Avatar src={picture} variant="square" sx={{ width: 24, height: 24 }} />
						<span className={classes.userComment}>{name}</span>
					</Grid>
				</Grid>
			</Grid>
		</Grid>
	);
};

const Comments = ({ comments = {} }) => (
	<Paper marginBottom="0">
		<PaperHeader title={<Trans>Comments</Trans>} />
		{comments.map((item) => (
			<Comment {...item} key={item.id} />
		))}
	</Paper>
);

export default Comments;
