import { ClinicCorridor, ExamRoom, TeamRoom } from "./architecture";
import { AuthoredProofRoomOne } from "./authored-proof-room";

/** Phase-1 comparison: one authored room beside the untouched legacy room/corridor. */
export function AuthoredHospitalArchitecture() {
  return (
    <>
      <TeamRoom />
      <ClinicCorridor />
      <AuthoredProofRoomOne />
      <ExamRoom />
    </>
  );
}
