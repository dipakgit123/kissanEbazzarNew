import React from 'react';
import { Link } from 'react-router-dom';
import { featureAllowed } from '../utils/animalExperience';
export default function ExperienceLink(props) {
  return featureAllowed(typeof props.to === 'string' ? props.to : props.to?.pathname || '') ? <Link {...props} /> : null;
}
