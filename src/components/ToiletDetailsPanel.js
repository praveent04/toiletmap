import React from 'react';
import styled from '@emotion/styled';
import { faClock, faEdit } from '@fortawesome/free-regular-svg-icons';
import {
  faDirections,
  faList,
  faTimes,
  faCheck,
  faPoundSign,
  faBaby,
  faWheelchair,
  faVenusMars,
  faGenderless,
  faKey,
  faCog,
  faQuestion,
} from '@fortawesome/free-solid-svg-icons';
import { DateTime } from 'luxon';
import { Link } from 'react-router-dom';

import Box from './Box';
import Button from './Button';
import Text from './Text';
import Spacer from './Spacer';
import Icon from './Icon';
import {
  getOpeningTimes,
  getIsOpen,
  WEEKDAYS,
  rangeTypes,
} from '../openingHours';
import { useMutation, gql } from '@apollo/client';

const Grid = styled(Box)`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin: -${({ theme }) => theme.space[3]}px;
`;

const UnstyledList = styled.ul`
  list-style: none;
`;

function getTimeRangeLabel(range) {
  if (range === rangeTypes.CLOSED) {
    return 'Closed';
  }

  if (range.length === 2) {
    return range.join(' - ');
  }

  return 'Unknown';
}

function getIsOpenLabel(openingTimes = [], dateTime = DateTime.local()) {
  const isOpen = getIsOpen(openingTimes, dateTime);

  if (isOpen === null) {
    return 'Unknown';
  }

  return isOpen ? 'Open now' : 'Closed';
}

const SUBMIT_VERIFICATION_REPORT_MUTATION = gql`
  mutation submitVerificationReportMutation($id: ID) {
    submitVerificationReport(id: $id) {
      loo {
        id
        verifiedAt
      }
    }
  }
`;

const ToiletDetailsPanel = ({ data, isLoading }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const [
    submitVerificationReport,
    { loading: submitVerificationLoading },
  ] = useMutation(SUBMIT_VERIFICATION_REPORT_MUTATION);

  // collapse panel if isLoading or data changes (e.g. a user has selected a new marker)
  // React.useEffect(() => {
  //   setIsExpanded(false);
  // }, [isLoading, data]);

  // programmatically set focus on close button when panel expands
  const closeButtonRef = React.useRef();
  React.useEffect(() => {
    if (isExpanded && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isExpanded]);

  if (isLoading) {
    return (
      <Box
        width="100%"
        color="primary"
        bg="white"
        minHeight={100}
        borderTopLeftRadius={4}
        borderTopRightRadius={4}
        padding={4}
        display="flex"
        alignItems="center"
      >
        Loading toilet...
      </Box>
    );
  }

  const titleFragment = (
    <Text fontWeight="bold" fontSize={4}>
      <h2 id="toilet-details-heading">{data.name || 'Unnamed Toilet'}</h2>
    </Text>
  );

  const getDirectionsFragment = (
    <Button
      icon={<Icon icon={faDirections} />}
      as="a"
      href={`https://maps.apple.com/?dirflg=w&daddr=${[
        data.location.lat,
        data.location.lng,
      ]}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      Get directions
    </Button>
  );

  const crossIconFragment = <Icon icon={faTimes} color="tertiary" />;
  const questionIconFragment = <Icon icon={faQuestion} color="tertiary" />;
  const checkIconFragment = <Icon icon={faCheck} />;

  const getFeatureValueIcon = (value, checkFunction) => {
    if (value === null) {
      return questionIconFragment;
    }

    if (checkFunction) {
      return checkFunction() ? checkIconFragment : crossIconFragment;
    }

    return value ? checkIconFragment : crossIconFragment;
  };

  const features = [
    {
      icon: <Icon icon={faPoundSign} />,
      label: 'Free',
      valueIcon: getFeatureValueIcon(data.fee, () => !data.fee),
    },
    {
      icon: <Icon icon={faBaby} />,
      label: 'Baby Changing',
      valueIcon: getFeatureValueIcon(data.babyChange),
    },
    {
      icon: <Icon icon={faWheelchair} />,
      label: 'Accessible',
      valueIcon: getFeatureValueIcon(data.accessibleType),
    },
    ...(data.accessibleType
      ? [
          {
            icon: <Icon icon={faKey} />,
            label: 'RADAR Key',
            valueIcon: getFeatureValueIcon(data.radar),
          },
        ]
      : []),
    {
      icon: <Icon icon={faVenusMars} />,
      label: 'Unisex',
      valueIcon: getFeatureValueIcon(data.type, () => data.type === 'UNISEX'),
    },
    {
      icon: <Icon icon={faGenderless} />,
      label: 'Gender Neutral',
      valueIcon: getFeatureValueIcon(data.type, () => data.type === 'UNISEX'),
    },
    {
      icon: <Icon icon={faCog} />,
      label: 'Automatic',
      valueIcon: getFeatureValueIcon(data.automatic),
    },
  ];

  const openingTimes = getOpeningTimes(data.opening);
  const todayWeekdayIndex = DateTime.local().weekday - 1;

  const editUrl = `/loos/${data.id}/edit`;

  const updatedAt = DateTime.fromISO(data.updatedAt);
  let verifiedOrUpdatedDate = updatedAt;
  if (data.verifiedAt) {
    const verifiedAt = DateTime.fromISO(data.verifiedAt);
    if (updatedAt < verifiedAt) {
      verifiedOrUpdatedDate = verifiedAt;
    }
  }

  if (isExpanded) {
    return (
      <Box
        width="100%"
        color="primary"
        bg="white"
        maxHeight={400}
        overflow="auto"
        borderTopLeftRadius={4}
        borderTopRightRadius={4}
        padding={4}
        paddingRight={5}
        as="section"
        aria-labelledby="toilet-details-heading"
      >
        <Grid>
          <Box position="absolute" top={30} right={30}>
            <button
              type="button"
              aria-label="Close toilet details"
              onClick={() => setIsExpanded(false)}
              aria-expanded="true"
              ref={closeButtonRef}
            >
              <Box
                height={26}
                width={26}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius={13}
                borderColor="primary"
                borderWidth={1}
                borderStyle="solid"
              >
                <Icon icon={faTimes} />
              </Box>
            </button>
          </Box>

          <Box width={['100%', '50%', '25%']} padding={3}>
            {titleFragment}
            <Spacer mb={2} />
            {getDirectionsFragment}
            <Spacer mb={4} />
            <Text fontWeight="bold">
              <h2>Is this information correct?</h2>
            </Text>
            <Spacer mb={2} />
            <Box display="flex" alignItems="center">
              <Button
                onClick={() =>
                  submitVerificationReport({ variables: { id: data.id } })
                }
                disabled={submitVerificationLoading}
              >
                Yes
              </Button>
              <Spacer mr={4} />
              <Box display="flex" alignItems="center">
                No?
                <Spacer mr={2} />
                <Button
                  variant="secondary"
                  icon={<Icon icon={faEdit} />}
                  as={Link}
                  to={editUrl}
                >
                  Edit
                </Button>
              </Box>
            </Box>
            <Spacer mb={2} />
            Last verified:{' '}
            {verifiedOrUpdatedDate.toLocaleString(DateTime.DATETIME_SHORT)}
          </Box>

          <Box width={['100%', '50%', '25%']} padding={3} order={[0, 1]}>
            <Box display="flex" alignItems="center">
              <Icon icon={faClock} />
              <Spacer mr={2} />
              <Text fontWeight="bold">
                <h2>Opening Hours</h2>
              </Text>
            </Box>
            <Spacer mb={2} />
            <UnstyledList>
              {openingTimes.map((timeRange, i) => (
                <Box
                  as="li"
                  display="flex"
                  justifyContent="space-between"
                  key={i}
                  padding={1}
                  bg={i === todayWeekdayIndex ? 'ice' : 'white'}
                >
                  <span>{WEEKDAYS[i]}</span>
                  <span>{getTimeRangeLabel(timeRange)}</span>
                </Box>
              ))}
            </UnstyledList>
            <Spacer mb={2} />
            <Text fontSize={1} color="grey">
              Hours may vary with national holidays or seasonal changes. If you
              know these hours to be out of date please{' '}
              <Button as={Link} to={editUrl} variant="link">
                edit this toilet
              </Button>
              .
            </Text>
          </Box>

          <Box width={['100%', '50%', '25%']} padding={3}>
            <Text fontWeight="bold">
              <h3>Features</h3>
            </Text>
            <Spacer mb={2} />
            <UnstyledList>
              {features.map((feature) => (
                <Box
                  as="li"
                  key={feature.label}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1}
                >
                  <Box display="flex" alignItems="center">
                    <Box width="20px" display="flex" justifyContent="center">
                      {feature.icon}
                    </Box>
                    <Spacer mr={2} />
                    {feature.label}
                  </Box>
                  {feature.valueIcon}
                </Box>
              ))}
            </UnstyledList>
          </Box>

          <Box width={['100%', '50%', '25%']} padding={3}>
            {Boolean(data.fee) && (
              <>
                <Text fontWeight="bold">
                  <h3>Fee</h3>
                </Text>
                <Spacer mb={2} />
                {data.fee}
                <Spacer mb={3} />
              </>
            )}
            {Boolean(data.notes) && (
              <>
                <Text fontWeight="bold">
                  <h3>Notes</h3>
                </Text>
                <Spacer mb={2} />
                <div>
                  {data.notes.split('\n').map((string, i) => (
                    <div key={i}>{string}</div>
                  ))}
                </div>
              </>
            )}
          </Box>
        </Grid>
      </Box>
    );
  }

  return (
    <Box
      width="100%"
      color="primary"
      bg="white"
      minHeight={100}
      borderTopLeftRadius={4}
      borderTopRightRadius={4}
      padding={4}
      as="section"
      aria-labelledby="toilet-details-heading"
    >
      <Grid>
        <Box width={['100%', '50%', '25%']} padding={3}>
          {titleFragment}
        </Box>

        <Box width={['100%', '50%', '25%']} padding={3}>
          <Box display="flex" alignItems="center">
            <Icon icon={faClock} />
            <Spacer mr={2} />
            <Text fontWeight="bold">
              <h3>Opening Hours</h3>
            </Text>
          </Box>
          <Spacer mb={2} />
          {getIsOpenLabel(openingTimes)}
        </Box>

        <Box
          width={['100%', '50%']}
          padding={3}
          display="flex"
          justifyContent={['flex-start', 'flex-start', 'flex-end']}
          alignItems="center"
        >
          {getDirectionsFragment}
          <Spacer mr={2} />
          <Button
            variant="secondary"
            icon={<Icon icon={faList} />}
            onClick={() => setIsExpanded(true)}
            aria-expanded="false"
          >
            More details
          </Button>
        </Box>
      </Grid>
    </Box>
  );
};

export default ToiletDetailsPanel;