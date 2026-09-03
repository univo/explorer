"use client";

interface TimestampProps {
	/** UTC timestamp to localise in the client timezone */
	utc: Date;
	/** Boolean to include the time: 8:45 pm */
	time?: boolean;
	/** Boolean to include the date: Thu, 3 Sept, 26 */
	date?: boolean;
}

/**
 * Renders a client-localised timestamp
 */
export function Timestamp(props: TimestampProps) {
	const { utc, time = false, date = false } = props;

	if (date === true && time === true) {
		return formatDateTime(utc);
	}

	if (date === false && time === true) {
		return formatTime(utc);
	}

	if (date === true && time === false) {
		return formatDate(utc);
	}

	return;
}

const dateTime = new Intl.DateTimeFormat("en-GB", {
	hour12: true,
	hour: "numeric",
	minute: "2-digit",
	weekday: "short",
	month: "short",
	day: "numeric",
	year: "2-digit",
});

function formatDateTime(date: Date) {
	return dateTime.format(date);
}

const time = new Intl.DateTimeFormat("en-GB", {
	hour12: true,
	hour: "numeric",
	minute: "2-digit",
});

function formatTime(date: Date) {
	return time.format(date);
}

function formatDate(date: Date) {
	return date.toLocaleDateString("en", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}
