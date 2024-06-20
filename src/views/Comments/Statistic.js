import React from 'react';

import makeStyles from '@mui/styles/makeStyles';
import { Stack } from '@mui/system';

import Paper from '../../misc/Paper';

const useStyles = makeStyles((theme) => ({
	title: {
		margin: 0,
    color: 'rgba(255,255,255,0.6)',
	},
	value: {
		margin: 0,
	},
}));

const Statistic = ({ statistics = {} }) => {
	const classes = useStyles();

	return (
		<Paper marginBottom="12px">
			<Stack container alignItems="center" justifyContent="space-around" direction="row" gap="4px">
				<Stack alignItems="center" justifyContent="center" direction="column">
					<p className={classes.title}>Likes</p>
					<p className={classes.value}>{statistics.likes}</p>
				</Stack>

				<Stack alignItems="center" justifyContent="center" direction="column">
					<p className={classes.title}>Comments</p>
					<p className={classes.value}>{statistics.comments}</p>
				</Stack>
			</Stack>
		</Paper>
	);
};

export default Statistic;
